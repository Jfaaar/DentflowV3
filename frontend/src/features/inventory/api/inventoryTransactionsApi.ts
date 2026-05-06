import { baseApi } from '@/services/api/baseApi';

export interface InventoryTransaction {
  id: string;
  medicamentId: string;
  medicamentName: string;
  type: 'IN' | 'OUT' | 'ADJUST';
  quantity: number;
  reason?: string;
  date: string;
}

export const inventoryTransactionsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listInventoryTransactions: build.query<
      { data: InventoryTransaction[]; page: number; pageSize: number; total: number },
      { page?: number; pageSize?: number; itemId?: string } | void
    >({
      query: (params) => ({
        url: 'inventory-transactions',
        params: (params ?? undefined) as Record<string, unknown> | undefined,
      }),
      transformResponse: (r: {
        data: { data: InventoryTransaction[]; page: number; pageSize: number; total: number };
      }) => r.data,
      providesTags: (result) =>
        result
          ? [
              ...result.data.map((t) => ({ type: 'InventoryTransaction' as const, id: t.id })),
              { type: 'InventoryTransaction' as const, id: 'LIST' },
            ]
          : [{ type: 'InventoryTransaction' as const, id: 'LIST' }],
    }),
    createInventoryTransaction: build.mutation<
      InventoryTransaction,
      Omit<InventoryTransaction, 'id' | 'date' | 'medicamentName'>
    >({
      query: (body) => ({ url: 'inventory-transactions', method: 'POST', body }),
      transformResponse: (r: { data: InventoryTransaction }) => r.data,
      invalidatesTags: [
        { type: 'InventoryTransaction', id: 'LIST' },
        { type: 'Inventory', id: 'LIST' },
      ],
    }),
    deleteInventoryTransaction: build.mutation<void, string>({
      query: (id) => ({ url: `inventory-transactions/${id}`, method: 'DELETE' }),
      invalidatesTags: [
        { type: 'InventoryTransaction', id: 'LIST' },
        { type: 'Inventory', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useListInventoryTransactionsQuery,
  useCreateInventoryTransactionMutation,
  useDeleteInventoryTransactionMutation,
} = inventoryTransactionsApi;
