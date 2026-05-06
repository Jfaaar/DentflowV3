import { baseApi } from '@/services/api/baseApi';

export type TreatmentPlanStatus =
  | 'draft'
  | 'proposed'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'canceled';

export interface TreatmentPlan {
  id: string;
  clinicId: string;
  patientId: string;
  doctorId?: string;
  title?: string;
  status: TreatmentPlanStatus;
  estimatedTotal?: number;
  discount?: number;
  insuranceCovered?: number;
  patientResponsibility?: number;
  acceptedAt?: string;
}

export const treatmentPlansApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listTreatmentPlans: build.query<
      { data: TreatmentPlan[]; page: number; pageSize: number; total: number },
      { page?: number; pageSize?: number; patientId?: string; status?: TreatmentPlanStatus } | void
    >({
      query: (params) => ({
        url: 'treatment-plans',
        params: (params ?? undefined) as Record<string, unknown> | undefined,
      }),
      transformResponse: (r: {
        data: { data: TreatmentPlan[]; page: number; pageSize: number; total: number };
      }) => r.data,
      providesTags: (result) =>
        result
          ? [
              ...result.data.map((p) => ({ type: 'TreatmentPlan' as const, id: p.id })),
              { type: 'TreatmentPlan' as const, id: 'LIST' },
            ]
          : [{ type: 'TreatmentPlan' as const, id: 'LIST' }],
    }),
    getTreatmentPlan: build.query<TreatmentPlan, string>({
      query: (id) => ({ url: `treatment-plans/${id}` }),
      transformResponse: (r: { data: TreatmentPlan }) => r.data,
      providesTags: (_r, _e, id) => [{ type: 'TreatmentPlan', id }],
    }),
    createTreatmentPlan: build.mutation<TreatmentPlan, Omit<TreatmentPlan, 'id' | 'clinicId'>>({
      query: (body) => ({ url: 'treatment-plans', method: 'POST', body }),
      transformResponse: (r: { data: TreatmentPlan }) => r.data,
      invalidatesTags: [{ type: 'TreatmentPlan', id: 'LIST' }],
    }),
    updateTreatmentPlan: build.mutation<TreatmentPlan, { id: string; patch: Partial<TreatmentPlan> }>({
      query: ({ id, patch }) => ({ url: `treatment-plans/${id}`, method: 'PUT', body: patch }),
      transformResponse: (r: { data: TreatmentPlan }) => r.data,
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'TreatmentPlan', id },
        { type: 'TreatmentPlan', id: 'LIST' },
      ],
    }),
    cancelTreatmentPlan: build.mutation<void, string>({
      query: (id) => ({ url: `treatment-plans/${id}/cancel`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'TreatmentPlan', id },
        { type: 'TreatmentPlan', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useListTreatmentPlansQuery,
  useGetTreatmentPlanQuery,
  useCreateTreatmentPlanMutation,
  useUpdateTreatmentPlanMutation,
  useCancelTreatmentPlanMutation,
} = treatmentPlansApi;
