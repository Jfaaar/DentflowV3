export {
  patientsApi,
  useListPatientsQuery,
  useGetPatientQuery,
  useCreatePatientMutation,
  useUpdatePatientMutation,
  useArchivePatientMutation,
  useDeletePatientMutation,
} from './api/patientsApi';
export type {
  Patient,
  PatientsListParams,
  PatientsListResponse,
} from './api/patientsApi';
