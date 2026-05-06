export {
  clinicalApi,
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
} from './api/clinicalApi';
export type { ClinicalNote, DentalChartEntry } from './api/clinicalApi';
