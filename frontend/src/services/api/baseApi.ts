import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getStoredToken } from '@/shared/storage/authStorage';

function getBaseUrl(): string {
  const base = (import.meta.env as Record<string, string | undefined>).VITE_API_BASE_URL;
  if (base?.trim()) return base.trim().replace(/\/$/, '');
  return '/api/v1';
}

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: getBaseUrl(),
    prepareHeaders(headers, { endpoint }) {
      const token = getStoredToken();
      if (token) headers.set('Authorization', `Bearer ${token}`);
      if (typeof endpoint === 'string' && endpoint.toLowerCase().includes('upload')) {
        return headers;
      }
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: [
    'User',
    'Auth',
    'Clinic',
    'Invitation',
    'Staff',
    'Patient',
    'Appointment',
    'Invoice',
    'Payment',
    'Treatment',
    'TreatmentPlan',
    'Quote',
    'Prescription',
    'Inventory',
    'InventoryTransaction',
    'Supplier',
    'ClinicalNote',
    'DentalChart',
    'InsurancePolicy',
    'InsuranceClaim',
    'Document',
    'Settings',
    'Stats',
  ],
  endpoints: () => ({}),
});
