export {
  treatmentsApi,
  useListTreatmentsQuery,
  useGetTreatmentQuery,
  useCreateTreatmentMutation,
  useUpdateTreatmentMutation,
  useCancelTreatmentMutation,
} from './api/treatmentsApi';
export type {
  Treatment,
  ConsumedMaterial,
  TreatmentsListParams,
  TreatmentsListResponse,
} from './api/treatmentsApi';

export {
  treatmentPlansApi,
  useListTreatmentPlansQuery,
  useGetTreatmentPlanQuery,
  useCreateTreatmentPlanMutation,
  useUpdateTreatmentPlanMutation,
  useCancelTreatmentPlanMutation,
} from './api/treatmentPlansApi';
export type { TreatmentPlan, TreatmentPlanStatus } from './api/treatmentPlansApi';

export {
  quotesApi,
  useListQuotesQuery,
  useGetQuoteQuery,
  useCreateQuoteMutation,
  useUpdateQuoteMutation,
  useExpireQuoteMutation,
} from './api/quotesApi';
export type { Quote } from './api/quotesApi';
