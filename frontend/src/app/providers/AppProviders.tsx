import { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { Toaster } from 'sonner';
import { store } from '@/store';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      {children}
      <Toaster
        position="top-right"
        richColors
        closeButton
        expand
        toastOptions={{ style: { whiteSpace: 'pre-line' } }}
      />
    </Provider>
  );
}
