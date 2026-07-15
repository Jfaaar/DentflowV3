// RTK Query endpoints for the dental lab-case board.
// Backend: backend/routes/dental.js → /api/v1/dental/lab-cases (gated by
// requireFeature('dentalChart')).
import { baseApi } from '@/services/api/baseApi';

export const LAB_CASE_TYPES = [
  'crown', 'bridge', 'denture', 'veneer',
  'implant_abutment', 'retainer', 'nightguard', 'other',
] as const;
export type LabCaseType = (typeof LAB_CASE_TYPES)[number];

export const LAB_CASE_STATUSES = [
  'sent', 'in_progress', 'received', 'delivered', 'cancelled',
] as const;
export type LabCaseStatus = (typeof LAB_CASE_STATUSES)[number];

export interface DentalLabCase {
  id: string;
  clinicId: string;
  patientId: string;
  labName: string;
  caseType: LabCaseType;
  status: LabCaseStatus;
  sentDate: string;
  dueDate?: string;
  receivedDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DentalLabCaseListResult {
  data: DentalLabCase[];
  page: number;
  pageSize: number;
  total: number;
}

export interface DentalLabCaseListArgs {
  patientId?: string;
  status?: LabCaseStatus;
  page?: number;
  pageSize?: number;
}

export type DentalLabCaseCreate = {
  patientId: string;
  labName: string;
  caseType: LabCaseType;
  status?: LabCaseStatus;
  sentDate?: string;
  dueDate?: string | null;
  receivedDate?: string | null;
  notes?: string | null;
};
export type DentalLabCaseUpdate = Partial<DentalLabCaseCreate>;

const TAG = 'DentalLabCase' as const;

export const dentalLabApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listLabCases: build.query<DentalLabCaseListResult, DentalLabCaseListArgs | void>({
      query: (args) => ({ url: 'dental/lab-cases', params: args ?? undefined }),
      transformResponse: (r: { data: DentalLabCaseListResult }) => r.data,
      providesTags: (result) =>
        result
          ? [{ type: TAG, id: 'LIST' }, ...result.data.map((c) => ({ type: TAG, id: c.id }))]
          : [{ type: TAG, id: 'LIST' }],
    }),
    getLabCase: build.query<DentalLabCase, string>({
      query: (id) => ({ url: `dental/lab-cases/${id}` }),
      transformResponse: (r: { data: DentalLabCase }) => r.data,
      providesTags: (_r, _e, id) => [{ type: TAG, id }],
    }),
    createLabCase: build.mutation<DentalLabCase, DentalLabCaseCreate>({
      query: (body) => ({ url: 'dental/lab-cases', method: 'POST', body }),
      transformResponse: (r: { data: DentalLabCase }) => r.data,
      invalidatesTags: [{ type: TAG, id: 'LIST' }],
    }),
    updateLabCase: build.mutation<DentalLabCase, { id: string; patch: DentalLabCaseUpdate }>({
      query: ({ id, patch }) => ({ url: `dental/lab-cases/${id}`, method: 'PUT', body: patch }),
      transformResponse: (r: { data: DentalLabCase }) => r.data,
      invalidatesTags: (_r, _e, { id }) => [{ type: TAG, id }, { type: TAG, id: 'LIST' }],
    }),
    deleteLabCase: build.mutation<void, string>({
      query: (id) => ({ url: `dental/lab-cases/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: TAG, id: 'LIST' }],
    }),
  }),
});

export const {
  useListLabCasesQuery,
  useGetLabCaseQuery,
  useCreateLabCaseMutation,
  useUpdateLabCaseMutation,
  useDeleteLabCaseMutation,
} = dentalLabApi;
