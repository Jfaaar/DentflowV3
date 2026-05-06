import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'error';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'clinic_admin' | 'doctor' | 'assistant';
  clinicId?: string;
  avatar?: string;
}

export interface AuthState {
  user: AuthUser | null;
  status: AuthStatus;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  status: 'idle',
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setStatus(state, action: PayloadAction<AuthStatus>) {
      state.status = action.payload;
      if (action.payload !== 'error') state.error = null;
    },
    setUser(state, action: PayloadAction<AuthUser | null>) {
      state.user = action.payload;
      state.status = action.payload ? 'authenticated' : 'idle';
      state.error = null;
    },
    setError(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.status = 'error';
    },
    logout(state) {
      state.user = null;
      state.status = 'idle';
      state.error = null;
    },
  },
});

export const { setStatus, setUser, setError, logout } = authSlice.actions;
export const authReducer = authSlice.reducer;

// Selectors
export const selectAuthUser = (s: { auth: AuthState }) => s.auth.user;
export const selectAuthStatus = (s: { auth: AuthState }) => s.auth.status;
export const selectAuthError = (s: { auth: AuthState }) => s.auth.error;
export const selectIsAuthenticated = (s: { auth: AuthState }) => !!s.auth.user;
