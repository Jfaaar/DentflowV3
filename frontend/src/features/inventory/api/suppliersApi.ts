import { baseApi } from '@/services/api/baseApi';

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export const suppliersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listSuppliers: build.query<
      { data: Supplier[]; page: number; pageSize: number; total: number },
      { page?: number; pageSize?: number; search?: string } | void
    >({
      query: (params) => ({
        url: 'suppliers',
        params: (params ?? undefined) as Record<string, unknown> | undefined,
      }),
      transformResponse: (r: {
        data: { data: Supplier[]; page: number; pageSize: number; total: number };
      }) => r.data,
      providesTags: (result) =>
        result
          ? [
              ...result.data.map((s) => ({ type: 'Supplier' as const, id: s.id })),
              { type: 'Supplier' as const, id: 'LIST' },
            ]
          : [{ type: 'Supplier' as const, id: 'LIST' }],
    }),
    getSupplier: build.query<Supplier, string>({
      query: (id) => ({ url: `suppliers/${id}` }),
      transformResponse: (r: { data: Supplier }) => r.data,
      providesTags: (_r, _e, id) => [{ type: 'Supplier', id }],
    }),
    createSupplier: build.mutation<Supplier, Omit<Supplier, 'id'>>({
      query: (body) => ({ url: 'suppliers', method: 'POST', body }),
      transformResponse: (r: { data: Supplier }) => r.data,
      invalidatesTags: [{ type: 'Supplier', id: 'LIST' }],
    }),
    updateSupplier: build.mutation<Supplier, { id: string; patch: Partial<Supplier> }>({
      query: ({ id, patch }) => ({ url: `suppliers/${id}`, method: 'PUT', body: patch }),
      transformResponse: (r: { data: Supplier }) => r.data,
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Supplier', id },
        { type: 'Supplier', id: 'LIST' },
      ],
    }),
    deleteSupplier: build.mutation<void, string>({
      query: (id) => ({ url: `suppliers/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'Supplier', id },
        { type: 'Supplier', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useListSuppliersQuery,
  useGetSupplierQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
} = suppliersApi;
