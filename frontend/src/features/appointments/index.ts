export {
  appointmentsApi,
  useListAppointmentsQuery,
  useGetAppointmentQuery,
  useCreateAppointmentMutation,
  useUpdateAppointmentMutation,
  useCancelAppointmentMutation,
  useCancelManyAppointmentsMutation,
  useRestoreAppointmentMutation,
} from './api/appointmentsApi';
export type {
  Appointment,
  AppointmentStatus,
  AppointmentsListParams,
  AppointmentsListResponse,
} from './api/appointmentsApi';
