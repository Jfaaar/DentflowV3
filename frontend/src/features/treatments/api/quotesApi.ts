import { baseApi } from '@/services/api/baseApi';
import type { Treatment } from './treatmentsApi';

export interface Quote {
  id: string;
  patientId: string;
  treatments: Treatment[];
  total: number;
  date: string;
  status: 'draft' | 'accepted' | 'rejected';
}

export const quotesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listQuotes: build.query<
      { data: Quote[]; page: number; pageSize: number; total: number },
      { page?: number; pageSize?: number; patientId?: string } | void
    >({
      query: (params) => ({
        url: 'quotes',
        params: (params ?? undefined) as Record<string, unknown> | undefined,
      }),
      transformResponse: (r: {
        data: { data: Quote[]; page: number; pageSize: number; total: number };
      }) => r.data,
      providesTags: (result) =>
        result
          ? [
              ...result.data.map((q) => ({ type: 'Quote' as const, id: q.id })),
              { type: 'Quote' as const, id: 'LIST' },
            ]
          : [{ type: 'Quote' as const, id: 'LIST' }],
    }),
    getQuote: build.query<Quote, string>({
      query: (id) => ({ url: `quotes/${id}` }),
      transformResponse: (r: { data: Quote }) => r.data,
      providesTags: (_r, _e, id) => [{ type: 'Quote', id }],
    }),
    createQuote: build.mutation<Quote, Omit<Quote, 'id'>>({
      query: (body) => ({ url: 'quotes', method: 'POST', body }),
      transformResponse: (r: { data: Quote }) => r.data,
      invalidatesTags: [{ type: 'Quote', id: 'LIST' }],
    }),
    updateQuote: build.mutation<Quote, { id: string; patch: Partial<Quote> }>({
      query: ({ id, patch }) => ({ url: `quotes/${id}`, method: 'PUT', body: patch }),
      transformResponse: (r: { data: Quote }) => r.data,
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Quote', id }, { type: 'Quote', id: 'LIST' }],
    }),
    expireQuote: build.mutation<void, string>({
      query: (id) => ({ url: `quotes/${id}/expire`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Quote', id }, { type: 'Quote', id: 'LIST' }],
    }),
  }),
});

export const {
  useListQuotesQuery,
  useGetQuoteQuery,
  useCreateQuoteMutation,
  useUpdateQuoteMutation,
  useExpireQuoteMutation,
} = quotesApi;
