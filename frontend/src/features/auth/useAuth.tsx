// useAuth — local-only session.
//
// Supabase has been removed. Until a real auth provider is wired up, the
// frontend uses a deterministic demo session: any login() with credentials
// "demo" / "demo" succeeds with a synthesized clinic_admin user. Other
// inputs report a generic failure.
//
// The Redux auth slice (features/auth/store/authSlice.ts) is the source of
// truth for downstream consumers; this hook is a thin wrapper that also
// keeps a localStorage mirror so reloads survive.

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { setUser as setReduxUser, logout as reduxLogout, AuthUser } from './store/authSlice';
import { setStoredToken, clearStoredToken } from '@/shared/storage/authStorage';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'clinic_admin' | 'doctor' | 'assistant';
  clinicId?: string;
  avatar?: string;
  phone?: string;
  needsProfileSetup?: boolean;
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

const USER_KEY = 'medineeo_user';

const DEMO_USER: User = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'demo@medineeo.local',
  name: 'Demo User',
  role: 'clinic_admin',
  clinicId: '00000000-0000-0000-0000-0000000000c1',
};

function readPersistedUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function persistUser(user: User | null): void {
  try {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  } catch {
    /* localStorage unavailable */
  }
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();
  const [state, setState] = useState<AuthState>(() => {
    const user = readPersistedUser();
    return {
      user,
      isAuthenticated: !!user,
      isLoading: false,
      error: null,
    };
  });

  // Mirror local state into Redux.
  useEffect(() => {
    if (state.user) {
      dispatch(setReduxUser(state.user as AuthUser));
    } else if (!state.isLoading) {
      dispatch(reduxLogout());
    }
  }, [state.user, state.isLoading, dispatch]);

  const login = async (credentials: LoginCredentials) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    if (credentials.email === 'demo' && credentials.password === 'demo') {
      // Frontend-only demo session. The backend's dev-bypass auth
      // middleware accepts any request from this user, so the wire is
      // real even though we don't mint a JWT here.
      persistUser(DEMO_USER);
      setStoredToken('demo-session-token');
      setState({ user: DEMO_USER, isAuthenticated: true, isLoading: false, error: null });
      return;
    }

    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: 'Login failed. Use demo / demo while the auth provider is being wired.',
    });
  };

  const register = async (_credentials: RegisterCredentials) => {
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: 'Registration is disabled until an auth provider is wired in.',
    });
  };

  const logout = async () => {
    persistUser(null);
    clearStoredToken();
    setState({ user: null, isAuthenticated: false, isLoading: false, error: null });
  };

  // Legacy API kept to avoid churn in callers; phone-OTP no longer wires up.
  const setPhoneUser = (userId: string, phone: string, needsSetup: boolean) => {
    if (needsSetup) {
      setState({
        user: {
          id: userId,
          email: '',
          name: 'Phone User',
          role: 'assistant',
          phone,
          needsProfileSetup: true,
        },
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } else {
      setState((prev) => ({ ...prev, error: 'Phone auth is disabled.' }));
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
