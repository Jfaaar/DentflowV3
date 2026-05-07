import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../../lib/supabase';
import { useAppDispatch } from '@/store/hooks';
import { setUser as setReduxUser, logout as reduxLogout, AuthUser } from './store/authSlice';
import { setStoredToken, clearStoredToken } from '@/shared/storage/authStorage';

// User type matching the app's expectations
interface User {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'clinic_admin' | 'doctor' | 'assistant';
  clinicId?: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  role?: 'doctor' | 'assistant' | 'admin';
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  setPhoneUser: (userId: string, phone: string, needsSetup: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Fetch user profile from Supabase profiles table
const fetchUserProfile = async (userId: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) {
    console.error('Failed to fetch profile:', error);
    return null;
  }

  // Get the auth user for email
  const { data: { user: authUser } } = await supabase.auth.getUser();

  return {
    id: data.id,
    email: authUser?.email || '',
    name: data.name || authUser?.email || 'User',
    role: data.role || 'assistant',
    clinicId: data.clinic_id,
    avatar: data.avatar,
  };
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true, // Start loading to check session
    error: null,
  });

  // Mirror local context state into Redux + localStorage for the new RTK Query
  // baseApi to read. Fully retired in Phase 4 when consumers move off context.
  useEffect(() => {
    if (state.user) {
      dispatch(setReduxUser(state.user as AuthUser));
    } else if (!state.isLoading) {
      dispatch(reduxLogout());
    }
  }, [state.user, state.isLoading, dispatch]);

  // Mirror Supabase access token into localStorage so baseApi.prepareHeaders
  // can attach it synchronously to outgoing requests.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) {
        setStoredToken(session.access_token);
      } else {
        clearStoredToken();
      }
    });
    return () => { subscription.unsubscribe(); };
  }, []);

  // Check session on mount and listen for auth changes
  useEffect(() => {
    // Get initial session
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        setState({
          user: profile,
          isAuthenticated: !!profile,
          isLoading: false,
          error: null,
        });
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        setState({
          user: profile,
          isAuthenticated: !!profile,
          isLoading: false,
          error: null,
        });
      } else if (event === 'SIGNED_OUT') {
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    // Frontend-only demo bypass. Backend wiring comes later.
    if (credentials.email === 'demo' && credentials.password === 'demo') {
      const demoUser: User = {
        id: 'demo-user',
        email: 'demo@dentflow.local',
        name: 'Demo User',
        role: 'clinic_admin',
        clinicId: 'demo-clinic',
      };
      setState({ user: demoUser, isAuthenticated: true, isLoading: false, error: null });
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) throw error;

      if (data.user) {
        const profile = await fetchUserProfile(data.user.id);
        setState({
          user: profile,
          isAuthenticated: !!profile,
          isLoading: false,
          error: null,
        });
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Login failed';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            name: credentials.name,
            role: credentials.role || 'assistant',
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Profile is created via database trigger
        // Wait a moment for trigger to complete
        await new Promise(resolve => setTimeout(resolve, 500));

        const profile = await fetchUserProfile(data.user.id);
        setState({
          user: profile,
          isAuthenticated: !!profile,
          isLoading: false,
          error: null,
        });
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Registration failed';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw err;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  };

  // Handle phone auth users (Firebase-based)
  const setPhoneUser = (userId: string, phone: string, needsSetup: boolean) => {
    if (needsSetup) {
      // User needs to complete registration - store phone for later
      setState({
        user: {
          id: userId,
          email: '',
          name: 'Phone User',
          role: 'assistant',
          phone,
          needsProfileSetup: true,
        } as User & { phone: string; needsProfileSetup: boolean },
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } else {
      // User has a profile - fetch it
      fetchUserProfile(userId).then(profile => {
        setState({
          user: profile,
          isAuthenticated: !!profile,
          isLoading: false,
          error: null,
        });
      });
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, setPhoneUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};