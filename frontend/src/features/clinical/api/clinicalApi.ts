import { baseApi } from '@/services/api/baseApi';

export interface ClinicalNote {
  id: string;
  clinicId: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  consultationReason?: string;
  symptoms?: string;
  diagnosis?: string;
  notes?: string;
  treatmentPlan?: string;
  followUp?: string;
  vitals?: Record<string, number | string>;
  signedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DentalChartEntry {
  id: string;
  clinicId: string;
  patientId: string;
  tooth: string;
  surface?: string;
  finding: string;
  notes?: string;
  recordedAt: string;
  recordedBy?: string;
}

export const clinicalApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // Notes
    listClinicalNotes: build.query<
      { data: ClinicalNote[]; page: number; pageSize: number; total: number },
      { page?: number; pageSize?: number; patientId?: string } | void
    >({
      query: (params) => ({
        url: 'clinical/notes',
        params: (params ?? undefined) as Record<string, unknown> | undefined,
      }),
      transformResponse: (r: {
        data: { data: ClinicalNote[]; page: number; pageSize: number; total: number };
      }) => r.data,
      providesTags: (result) =>
        result
          ? [
              ...result.data.map((n) => ({ type: 'ClinicalNote' as const, id: n.id })),
              { type: 'ClinicalNote' as const, id: 'LIST' },
            ]
          : [{ type: 'ClinicalNote' as const, id: 'LIST' }],
    }),
    getClinicalNote: build.query<ClinicalNote, string>({
      query: (id) => ({ url: `clinical/notes/${id}` }),
      transformResponse: (r: { data: ClinicalNote }) => r.data,
      providesTags: (_r, _e, id) => [{ type: 'ClinicalNote', id }],
    }),
    createClinicalNote: build.mutation<ClinicalNote, Partial<ClinicalNote>>({
      query: (body) => ({ url: 'clinical/notes', method: 'POST', body }),
      transformResponse: (r: { data: ClinicalNote }) => r.data,
      invalidatesTags: [{ type: 'ClinicalNote', id: 'LIST' }],
    }),
    updateClinicalNote: build.mutation<
      ClinicalNote,
      { id: string; patch: Partial<ClinicalNote> }
    >({
      query: ({ id, patch }) => ({ url: `clinical/notes/${id}`, method: 'PUT', body: patch }),
      transformResponse: (r: { data: ClinicalNote }) => r.data,
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'ClinicalNote', id },
        { type: 'ClinicalNote', id: 'LIST' },
      ],
    }),
    signClinicalNote: build.mutation<ClinicalNote, string>({
      query: (id) => ({ url: `clinical/notes/${id}/sign`, method: 'POST' }),
      transformResponse: (r: { data: ClinicalNote }) => r.data,
      invalidatesTags: (_r, _e, id) => [
        { type: 'ClinicalNote', id },
        { type: 'ClinicalNote', id: 'LIST' },
      ],
    }),
    deleteClinicalNote: build.mutation<void, string>({
      query: (id) => ({ url: `clinical/notes/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'ClinicalNote', id },
        { type: 'ClinicalNote', id: 'LIST' },
      ],
    }),

    // Dental chart
    listDentalChart: build.query<
      { data: DentalChartEntry[]; page: number; pageSize: number; total: number },
      { page?: number; pageSize?: number; patientId?: string } | void
    >({
      query: (params) => ({
        url: 'clinical/dental-chart',
        params: (params ?? undefined) as Record<string, unknown> | undefined,
      }),
      transformResponse: (r: {
        data: { data: DentalChartEntry[]; page: number; pageSize: number; total: number };
      }) => r.data,
      providesTags: (result) =>
        result
          ? [
              ...result.data.map((e) => ({ type: 'DentalChart' as const, id: e.id })),
              { type: 'DentalChart' as const, id: 'LIST' },
            ]
          : [{ type: 'DentalChart' as const, id: 'LIST' }],
    }),
    createDentalChartEntry: build.mutation<DentalChartEntry, Partial<DentalChartEntry>>({
      query: (body) => ({ url: 'clinical/dental-chart', method: 'POST', body }),
      transformResponse: (r: { data: DentalChartEntry }) => r.data,
      invalidatesTags: [{ type: 'DentalChart', id: 'LIST' }],
    }),
    updateDentalChartEntry: build.mutation<
      DentalChartEntry,
      { id: string; patch: Partial<DentalChartEntry> }
    >({
      query: ({ id, patch }) => ({
        url: `clinical/dental-chart/${id}`,
        method: 'PUT',
        body: patch,
      }),
      transformResponse: (r: { data: DentalChartEntry }) => r.data,
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'DentalChart', id },
        { type: 'DentalChart', id: 'LIST' },
      ],
    }),
    deleteDentalChartEntry: build.mutation<void, string>({
      query: (id) => ({ url: `clinical/dental-chart/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'DentalChart', id },
        { type: 'DentalChart', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useListClinicalNotesQuery,
  useGetClinicalNoteQuery,
  useCreateClinicalNoteMutation,
  useUpdateClinicalNoteMutation,
  useSignClinicalNoteMutation,
  useDeleteClinicalNoteMutation,
  useListDentalChartQuery,
  useCreateDentalChartEntryMutation,
  useUpdateDentalChartEntryMutation,
  useDeleteDentalChartEntryMutation,
} = clinicalApi;
