import { baseApi } from '@/services/api/baseApi';

export const SPECIALTY_CODES = [
  'general_practice',
  'dental',
  'pediatrics',
  'gynecology',
  'cardiology',
  'dermatology',
  'ent',
  'ophthalmology',
  'orthopedics',
  'psychiatry',
  'other',
] as const;
export type SpecialtyCode = (typeof SPECIALTY_CODES)[number];

export interface ClinicSettings {
  clinicId: string;
  logoUrl?: string;
  taxId?: string;
  currency: string;
  timezone: string;
  defaultLanguage: string;
  workingHours?: Record<string, Array<{ start: string; end: string }>>;
  defaultAppointmentMinutes: number;
  invoiceNumberFormat: string;
  invoiceSeq: number;
  prescriptionTemplate?: string;
  quoteTemplate?: string;
  primarySpecialty: SpecialtyCode;
  enabledSpecialties: SpecialtyCode[];
  updatedAt: string;
}

export const settingsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getSettings: build.query<ClinicSettings | null, void>({
      query: () => ({ url: 'settings' }),
      transformResponse: (r: { data: ClinicSettings | null }) => r.data,
      providesTags: [{ type: 'Settings', id: 'CURRENT' }],
    }),
    updateSettings: build.mutation<ClinicSettings, Partial<ClinicSettings>>({
      query: (body) => ({ url: 'settings', method: 'PUT', body }),
      transformResponse: (r: { data: ClinicSettings }) => r.data,
      invalidatesTags: [{ type: 'Settings', id: 'CURRENT' }],
    }),
  }),
});

export const { useGetSettingsQuery, useUpdateSettingsMutation } = settingsApi;
