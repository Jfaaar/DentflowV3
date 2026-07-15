// RTK Query endpoints for periodontal charts.
// Backend: backend/routes/dental.js → /api/v1/dental/perio (gated by
// requireFeature('perioChart')). A chart is a header + its 6-site-per-tooth
// rows; site writes are replace-semantics (PUT /perio/:id/sites).
import { baseApi } from '@/services/api/baseApi';

export const PERIO_POSITIONS = [
  'buccal_mesial', 'buccal_mid', 'buccal_distal',
  'lingual_mesial', 'lingual_mid', 'lingual_distal',
] as const;
export type PerioPosition = (typeof PERIO_POSITIONS)[number];

export interface PerioSite {
  id?: string;
  perioChartId?: string;
  clinicId?: string;
  tooth: string;
  position: PerioPosition;
  pocketDepthMm?: number | null;
  recessionMm?: number | null;
  bleedingOnProbing?: boolean;
  suppuration?: boolean;
  mobility?: number | null;
  furcation?: number | null;
}

export interface PerioChartHeader {
  id: string;
  clinicId: string;
  patientId: string;
  chartedAt: string;
  chartedBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PerioChart extends PerioChartHeader {
  sites: PerioSite[];
}

export interface PerioChartListResult {
  data: PerioChartHeader[];
  page: number;
  pageSize: number;
  total: number;
}

const TAG = 'PerioChart' as const;

export const perioApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listPerioCharts: build.query<PerioChartListResult, { patientId: string; page?: number; pageSize?: number }>({
      query: (args) => ({ url: 'dental/perio', params: args }),
      transformResponse: (r: { data: PerioChartListResult }) => r.data,
      providesTags: (result) =>
        result
          ? [{ type: TAG, id: 'LIST' }, ...result.data.map((c) => ({ type: TAG, id: c.id }))]
          : [{ type: TAG, id: 'LIST' }],
    }),
    getPerioChart: build.query<PerioChart, string>({
      query: (id) => ({ url: `dental/perio/${id}` }),
      transformResponse: (r: { data: PerioChart }) => r.data,
      providesTags: (_r, _e, id) => [{ type: TAG, id }],
    }),
    createPerioChart: build.mutation<PerioChartHeader, { patientId: string; chartedAt?: string; notes?: string | null; sites?: PerioSite[] }>({
      query: (body) => ({ url: 'dental/perio', method: 'POST', body }),
      transformResponse: (r: { data: PerioChartHeader }) => r.data,
      invalidatesTags: [{ type: TAG, id: 'LIST' }],
    }),
    updatePerioChart: build.mutation<PerioChartHeader, { id: string; patch: { notes?: string | null; chartedAt?: string } }>({
      query: ({ id, patch }) => ({ url: `dental/perio/${id}`, method: 'PUT', body: patch }),
      transformResponse: (r: { data: PerioChartHeader }) => r.data,
      invalidatesTags: (_r, _e, { id }) => [{ type: TAG, id }, { type: TAG, id: 'LIST' }],
    }),
    replacePerioSites: build.mutation<PerioSite[], { id: string; sites: PerioSite[] }>({
      query: ({ id, sites }) => ({ url: `dental/perio/${id}/sites`, method: 'PUT', body: { sites } }),
      transformResponse: (r: { data: PerioSite[] }) => r.data,
      invalidatesTags: (_r, _e, { id }) => [{ type: TAG, id }],
    }),
    deletePerioChart: build.mutation<void, string>({
      query: (id) => ({ url: `dental/perio/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: TAG, id: 'LIST' }],
    }),
  }),
});

export const {
  useListPerioChartsQuery,
  useGetPerioChartQuery,
  useCreatePerioChartMutation,
  useUpdatePerioChartMutation,
  useReplacePerioSitesMutation,
  useDeletePerioChartMutation,
} = perioApi;
