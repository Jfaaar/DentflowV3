import { baseApi } from '@/services/api/baseApi';

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'canceled'
  | 'no_show';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  start: string;
  end: string;
  status: AppointmentStatus;
  observation?: string;
  createdAt: string;
}

export interface AppointmentsListParams {
  page?: number;
  pageSize?: number;
  patientId?: string;
  status?: AppointmentStatus;
  from?: string;
  to?: string;
}

export interface AppointmentsListResponse {
  data: Appointment[];
  page: number;
  pageSize: number;
  total: number;
}

export const appointmentsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listAppointments: build.query<AppointmentsListResponse, AppointmentsListParams | void>({
      query: (params) => ({
        url: 'appointments',
        params: (params ?? undefined) as Record<string, unknown> | undefined,
      }),
      transformResponse: (r: { data: AppointmentsListResponse }) => r.data,
      providesTags: (result) =>
        result
          ? [
              ...result.data.map((a) => ({ type: 'Appointment' as const, id: a.id })),
              { type: 'Appointment' as const, id: 'LIST' },
            ]
          : [{ type: 'Appointment' as const, id: 'LIST' }],
    }),
    getAppointment: build.query<Appointment, string>({
      query: (id) => ({ url: `appointments/${id}` }),
      transformResponse: (r: { data: Appointment }) => r.data,
      providesTags: (_r, _e, id) => [{ type: 'Appointment', id }],
    }),
    createAppointment: build.mutation<Appointment, Partial<Appointment>>({
      query: (body) => ({ url: 'appointments', method: 'POST', body }),
      transformResponse: (r: { data: Appointment }) => r.data,
      invalidatesTags: (result) =>
        result
          ? [{ type: 'Appointment', id: 'LIST' }, { type: 'Patient', id: result.patientId }]
          : [{ type: 'Appointment', id: 'LIST' }],
    }),
    updateAppointment: build.mutation<Appointment, { id: string; patch: Partial<Appointment> }>({
      query: ({ id, patch }) => ({ url: `appointments/${id}`, method: 'PUT', body: patch }),
      transformResponse: (r: { data: Appointment }) => r.data,
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Appointment', id },
        { type: 'Appointment', id: 'LIST' },
      ],
    }),
    cancelAppointment: build.mutation<void, { id: string; reason?: string }>({
      query: ({ id, reason }) => ({
        url: `appointments/${id}/cancel`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Appointment', id },
        { type: 'Appointment', id: 'LIST' },
      ],
    }),
    cancelManyAppointments: build.mutation<void, string[]>({
      query: (ids) => ({ url: 'appointments/cancel-many', method: 'POST', body: { ids } }),
      invalidatesTags: [{ type: 'Appointment', id: 'LIST' }],
    }),
    restoreAppointment: build.mutation<Appointment, string>({
      query: (id) => ({ url: `appointments/${id}/restore`, method: 'POST' }),
      transformResponse: (r: { data: Appointment }) => r.data,
      invalidatesTags: (_r, _e, id) => [
        { type: 'Appointment', id },
        { type: 'Appointment', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useListAppointmentsQuery,
  useGetAppointmentQuery,
  useCreateAppointmentMutation,
  useUpdateAppointmentMutation,
  useCancelAppointmentMutation,
  useCancelManyAppointmentsMutation,
  useRestoreAppointmentMutation,
} = appointmentsApi;
