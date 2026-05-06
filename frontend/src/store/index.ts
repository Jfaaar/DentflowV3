import { configureStore, Middleware } from '@reduxjs/toolkit';
import { baseApi } from '@/services/api/baseApi';
import { authReducer, logout } from '@/features/auth/store/authSlice';

const resetApiOnLogout: Middleware = (api) => (next) => (action) => {
  if (typeof action === 'object' && action !== null && 'type' in action && (action as { type: string }).type === logout.type) {
    api.dispatch(baseApi.util.resetApiState());
  }
  return next(action);
};

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefault) => getDefault().concat(resetApiOnLogout, baseApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
