// RTK Query endpoints for the orthodontic module.
// Backend: backend/routes/dental.js → /api/v1/dental/ortho/* (gated by
// requireFeature('orthoModule')). An episode is a course of treatment;
// visits hang off it via episodeId on list/create, by-id on update/delete.
import { baseApi } from '@/services/api/baseApi';

export const ORTHO_STATUSES = ['active', 'retention', 'completed', 'discontinued'] as const;
export type OrthoStatus = (typeof ORTHO_STATUSES)[number];

export interface OrthoEpisode {
  id: string;
  clinicId: string;
  patientId: string;
  startDate: string;
  endDate?: string;
  applianceType?: string;
  plan?: string;
  status: OrthoStatus;
  photoFileIds: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrthoVisit {
  id: string;
  orthoEpisodeId: string;
  clinicId: string;
  visitDate: string;
  changes?: string;
  adjustments?: string;
  photoFileIds: string[];
  performedBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface ListResult<T> { data: T[]; page: number; pageSize: number; total: number }

export type OrthoEpisodeCreate = {
  patientId: string;
  startDate?: string;
  endDate?: string | null;
  applianceType?: string | null;
  plan?: string | null;
  status?: OrthoStatus;
  notes?: string | null;
};
export type OrthoEpisodeUpdate = Partial<Omit<OrthoEpisodeCreate, 'patientId'>>;

export type OrthoVisitCreate = {
  visitDate?: string;
  changes?: string | null;
  adjustments?: string | null;
  notes?: string | null;
};
export type OrthoVisitUpdate = Partial<OrthoVisitCreate>;

const EP = 'OrthoEpisode' as const;
const VI = 'OrthoVisit' as const;

export const orthoApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // ── Episodes ────────────────────────────────────────────────────────────
    listOrthoEpisodes: build.query<OrthoEpisode[], { patientId: string; status?: OrthoStatus }>({
      query: (args) => ({ url: 'dental/ortho/episodes', params: { ...args, pageSize: 100 } }),
      transformResponse: (r: { data: ListResult<OrthoEpisode> }) => r.data.data,
      providesTags: (result) =>
        result
          ? [{ type: EP, id: 'LIST' }, ...result.map((e) => ({ type: EP, id: e.id }))]
          : [{ type: EP, id: 'LIST' }],
    }),
    createOrthoEpisode: build.mutation<OrthoEpisode, OrthoEpisodeCreate>({
      query: (body) => ({ url: 'dental/ortho/episodes', method: 'POST', body }),
      transformResponse: (r: { data: OrthoEpisode }) => r.data,
      invalidatesTags: [{ type: EP, id: 'LIST' }],
    }),
    updateOrthoEpisode: build.mutation<OrthoEpisode, { id: string; patch: OrthoEpisodeUpdate }>({
      query: ({ id, patch }) => ({ url: `dental/ortho/episodes/${id}`, method: 'PUT', body: patch }),
      transformResponse: (r: { data: OrthoEpisode }) => r.data,
      invalidatesTags: (_r, _e, { id }) => [{ type: EP, id }, { type: EP, id: 'LIST' }],
    }),
    deleteOrthoEpisode: build.mutation<void, string>({
      query: (id) => ({ url: `dental/ortho/episodes/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: EP, id: 'LIST' }],
    }),

    // ── Visits ──────────────────────────────────────────────────────────────
    listOrthoVisits: build.query<OrthoVisit[], string /* episodeId */>({
      query: (episodeId) => ({ url: `dental/ortho/episodes/${episodeId}/visits`, params: { pageSize: 200 } }),
      transformResponse: (r: { data: ListResult<OrthoVisit> }) => r.data.data,
      providesTags: (result, _e, episodeId) =>
        result
          ? [{ type: VI, id: `EP_${episodeId}` }, ...result.map((v) => ({ type: VI, id: v.id }))]
          : [{ type: VI, id: `EP_${episodeId}` }],
    }),
    createOrthoVisit: build.mutation<OrthoVisit, { episodeId: string; body: OrthoVisitCreate }>({
      query: ({ episodeId, body }) => ({ url: `dental/ortho/episodes/${episodeId}/visits`, method: 'POST', body }),
      transformResponse: (r: { data: OrthoVisit }) => r.data,
      invalidatesTags: (_r, _e, { episodeId }) => [{ type: VI, id: `EP_${episodeId}` }],
    }),
    updateOrthoVisit: build.mutation<OrthoVisit, { id: string; episodeId: string; patch: OrthoVisitUpdate }>({
      query: ({ id, patch }) => ({ url: `dental/ortho/visits/${id}`, method: 'PUT', body: patch }),
      transformResponse: (r: { data: OrthoVisit }) => r.data,
      invalidatesTags: (_r, _e, { id, episodeId }) => [{ type: VI, id }, { type: VI, id: `EP_${episodeId}` }],
    }),
    deleteOrthoVisit: build.mutation<void, { id: string; episodeId: string }>({
      query: ({ id }) => ({ url: `dental/ortho/visits/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, { episodeId }) => [{ type: VI, id: `EP_${episodeId}` }],
    }),
  }),
});

export const {
  useListOrthoEpisodesQuery,
  useCreateOrthoEpisodeMutation,
  useUpdateOrthoEpisodeMutation,
  useDeleteOrthoEpisodeMutation,
  useListOrthoVisitsQuery,
  useCreateOrthoVisitMutation,
  useUpdateOrthoVisitMutation,
  useDeleteOrthoVisitMutation,
} = orthoApi;
