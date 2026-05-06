import { baseApi } from '@/services/api/baseApi';

export interface Patient {
  id: string;
  name: string;
  phone: string;
  email?: string;
  profilePicture?: string;
  address?: string;
  birthDate?: string;
  gender?: 'male' | 'female';
  insuranceProvider?: string;
  status: 'active' | 'archived';
  createdAt: string;
  medicalHistory?: {
    allergies?: string[];
    conditions?: string[];
    medications?: string[];
    notes?: string;
  };
}

export interface PatientsListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: 'active' | 'archived';
}

export interface PatientsListResponse {
  data: Patient[];
  page: number;
  pageSize: number;
  total: number;
}

export const patientsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listPatients: build.query<PatientsListResponse, PatientsListParams | void>({
      query: (params) => ({ url: 'patients', params: (params ?? undefined) as Record<string, unknown> | undefined }),
      transformResponse: (r: { data: PatientsListResponse }) => r.data,
      providesTags: (result) =>
        result
          ? [
              ...result.data.map((p) => ({ type: 'Patient' as const, id: p.id })),
              { type: 'Patient' as const, id: 'LIST' },
            ]
          : [{ type: 'Patient' as const, id: 'LIST' }],
    }),
    getPatient: build.query<Patient, string>({
      query: (id) => ({ url: `patients/${id}` }),
      transformResponse: (r: { data: Patient }) => r.data,
      providesTags: (_result, _err, id) => [{ type: 'Patient', id }],
    }),
    createPatient: build.mutation<Patient, Partial<Patient>>({
      query: (body) => ({ url: 'patients', method: 'POST', body }),
      transformResponse: (r: { data: Patient }) => r.data,
      invalidatesTags: [{ type: 'Patient', id: 'LIST' }],
    }),
    updatePatient: build.mutation<Patient, { id: string; patch: Partial<Patient> }>({
      query: ({ id, patch }) => ({ url: `patients/${id}`, method: 'PUT', body: patch }),
      transformResponse: (r: { data: Patient }) => r.data,
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Patient', id }, { type: 'Patient', id: 'LIST' }],
    }),
    archivePatient: build.mutation<void, string>({
      query: (id) => ({ url: `patients/${id}/archive`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Patient', id }, { type: 'Patient', id: 'LIST' }],
    }),
    deletePatient: build.mutation<void, string>({
      query: (id) => ({ url: `patients/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Patient', id }, { type: 'Patient', id: 'LIST' }],
    }),
  }),
});

export const {
  useListPatientsQuery,
  useGetPatientQuery,
  useCreatePatientMutation,
  useUpdatePatientMutation,
  useArchivePatientMutation,
  useDeletePatientMutation,
} = patientsApi;
