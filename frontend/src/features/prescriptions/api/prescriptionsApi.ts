import { baseApi } from '@/services/api/baseApi';

export interface PrescriptionItem {
  medicamentId: string;
  medicamentName: string;
  dosage: string;
  frequency: string;
  duration: string;
  note?: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  date: string;
  items: PrescriptionItem[];
  notes?: string;
}

export const prescriptionsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listPrescriptions: build.query<
      { data: Prescription[]; page: number; pageSize: number; total: number },
      { page?: number; pageSize?: number; patientId?: string } | void
    >({
      query: (params) => ({
        url: 'prescriptions',
        params: (params ?? undefined) as Record<string, unknown> | undefined,
      }),
      transformResponse: (r: {
        data: { data: Prescription[]; page: number; pageSize: number; total: number };
      }) => r.data,
      providesTags: (result) =>
        result
          ? [
              ...result.data.map((p) => ({ type: 'Prescription' as const, id: p.id })),
              { type: 'Prescription' as const, id: 'LIST' },
            ]
          : [{ type: 'Prescription' as const, id: 'LIST' }],
    }),
    getPrescription: build.query<Prescription, string>({
      query: (id) => ({ url: `prescriptions/${id}` }),
      transformResponse: (r: { data: Prescription }) => r.data,
      providesTags: (_r, _e, id) => [{ type: 'Prescription', id }],
    }),
    createPrescription: build.mutation<Prescription, Omit<Prescription, 'id' | 'date'>>({
      query: (body) => ({ url: 'prescriptions', method: 'POST', body }),
      transformResponse: (r: { data: Prescription }) => r.data,
      invalidatesTags: [
        { type: 'Prescription', id: 'LIST' },
        { type: 'Inventory', id: 'LIST' },
      ],
    }),
    updatePrescription: build.mutation<
      Prescription,
      { id: string; patch: Partial<Prescription> }
    >({
      query: ({ id, patch }) => ({ url: `prescriptions/${id}`, method: 'PUT', body: patch }),
      transformResponse: (r: { data: Prescription }) => r.data,
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Prescription', id },
        { type: 'Prescription', id: 'LIST' },
      ],
    }),
    deletePrescription: build.mutation<void, string>({
      query: (id) => ({ url: `prescriptions/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'Prescription', id },
        { type: 'Prescription', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useListPrescriptionsQuery,
  useGetPrescriptionQuery,
  useCreatePrescriptionMutation,
  useUpdatePrescriptionMutation,
  useDeletePrescriptionMutation,
} = prescriptionsApi;
