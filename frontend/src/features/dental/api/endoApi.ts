// RTK Query endpoints for endodontic records.
// Backend: backend/routes/dental.js → /api/v1/dental/endo (gated by
// requireFeature('endoChart')). One record = one tooth treated on one date;
// `canals` is a free-form JSON array of per-canal readings.
import { baseApi } from '@/services/api/baseApi';

export interface EndoCanal {
  name?: string;
  lengthMm?: number;
  fileSize?: string;
  obturation?: string;
}

export interface EndoRecord {
  id: string;
  clinicId: string;
  patientId: string;
  tooth: string;
  treatmentDate: string;
  treatedBy?: string;
  diagnosis?: string;
  canals: EndoCanal[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EndoListResult {
  data: EndoRecord[];
  page: number;
  pageSize: number;
  total: number;
}

export type EndoRecordCreate = {
  patientId: string;
  tooth: string;
  treatmentDate?: string;
  treatedBy?: string | null;
  diagnosis?: string | null;
  canals?: EndoCanal[];
  notes?: string | null;
};
export type EndoRecordUpdate = Partial<EndoRecordCreate>;

const TAG = 'EndoRecord' as const;

export const endoApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listEndoRecords: build.query<EndoListResult, { patientId: string; page?: number; pageSize?: number }>({
      query: (args) => ({ url: 'dental/endo', params: args }),
      transformResponse: (r: { data: EndoListResult }) => r.data,
      providesTags: (result) =>
        result
          ? [{ type: TAG, id: 'LIST' }, ...result.data.map((c) => ({ type: TAG, id: c.id }))]
          : [{ type: TAG, id: 'LIST' }],
    }),
    getEndoRecord: build.query<EndoRecord, string>({
      query: (id) => ({ url: `dental/endo/${id}` }),
      transformResponse: (r: { data: EndoRecord }) => r.data,
      providesTags: (_r, _e, id) => [{ type: TAG, id }],
    }),
    createEndoRecord: build.mutation<EndoRecord, EndoRecordCreate>({
      query: (body) => ({ url: 'dental/endo', method: 'POST', body }),
      transformResponse: (r: { data: EndoRecord }) => r.data,
      invalidatesTags: [{ type: TAG, id: 'LIST' }],
    }),
    updateEndoRecord: build.mutation<EndoRecord, { id: string; patch: EndoRecordUpdate }>({
      query: ({ id, patch }) => ({ url: `dental/endo/${id}`, method: 'PUT', body: patch }),
      transformResponse: (r: { data: EndoRecord }) => r.data,
      invalidatesTags: (_r, _e, { id }) => [{ type: TAG, id }, { type: TAG, id: 'LIST' }],
    }),
    deleteEndoRecord: build.mutation<void, string>({
      query: (id) => ({ url: `dental/endo/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: TAG, id: 'LIST' }],
    }),
  }),
});

export const {
  useListEndoRecordsQuery,
  useGetEndoRecordQuery,
  useCreateEndoRecordMutation,
  useUpdateEndoRecordMutation,
  useDeleteEndoRecordMutation,
} = endoApi;
