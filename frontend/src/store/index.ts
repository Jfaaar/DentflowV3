import { configureStore, Middleware } from '@reduxjs/toolkit';
import { baseApi } from '@/services/api/baseApi';
import { authReducer, logout } from '@/features/auth/store/authSlice';

// Eagerly register feature RTK Query slices so injectEndpoints runs at startup.
import '@/features/patients/api/patientsApi';
import '@/features/appointments/api/appointmentsApi';
import '@/features/invoices/api/invoicesApi';
import '@/features/invoices/api/paymentsApi';
import '@/features/treatments/api/treatmentsApi';
import '@/features/treatments/api/treatmentPlansApi';
import '@/features/treatments/api/quotesApi';
import '@/features/prescriptions/api/prescriptionsApi';
import '@/features/inventory/api/inventoryApi';
import '@/features/inventory/api/suppliersApi';
import '@/features/inventory/api/inventoryTransactionsApi';
import '@/features/clinical/api/clinicalApi';
import '@/features/insurance/api/insuranceApi';
import '@/features/settings/api/settingsApi';
import '@/features/dashboard/api/dashboardApi';

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
