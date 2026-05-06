
import { AuthState, AuthAction, User } from './types';
import { storage } from '../../lib/storage';

// Initial State checking LocalStorage
export const getInitialState = (): AuthState => {
  const persistedUser = storage.getUser();
  return {
    user: persistedUser,
    isAuthenticated: !!persistedUser,
    isLoading: false,
    error: null,
  };
};

// Reducer Function
export const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        error: null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};
