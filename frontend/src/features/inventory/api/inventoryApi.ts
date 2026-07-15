import { baseApi } from '@/services/api/baseApi';

export type InventoryItemType = 'medication' | 'consumable' | 'equipment' | 'instrument' | 'other';

export interface InventoryItem {
  id: string;
  name: string;
  type: InventoryItemType;
  category?: string;
  stock: number;
  minStock: number;
  supplier?: string;
  price?: number;
  form?: string;
  expiryDate?: string;
  brand?: string;
  serialNumber?: string;
  lastMaintenance?: string;
  location?: string;
}

export const inventoryApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listInventory: build.query<
      { data: InventoryItem[]; page: number; pageSize: number; total: number },
      { page?: number; pageSize?: number; search?: string; type?: InventoryItemType } | void
    >({
      query: (params) => ({
        url: 'inventory',
        params: (params ?? undefined) as Record<string, unknown> | undefined,
      }),
      transformResponse: (r: {
        data: { data: InventoryItem[]; page: number; pageSize: number; total: number };
      }) => r.data,
      providesTags: (result) =>
        result
          ? [
              ...result.data.map((i) => ({ type: 'Inventory' as const, id: i.id })),
              { type: 'Inventory' as const, id: 'LIST' },
            ]
          : [{ type: 'Inventory' as const, id: 'LIST' }],
    }),
    getInventoryItem: build.query<InventoryItem, string>({
      query: (id) => ({ url: `inventory/${id}` }),
      transformResponse: (r: { data: InventoryItem }) => r.data,
      providesTags: (_r, _e, id) => [{ type: 'Inventory', id }],
    }),
    createInventoryItem: build.mutation<InventoryItem, Omit<InventoryItem, 'id'>>({
      query: (body) => ({ url: 'inventory', method: 'POST', body }),
      transformResponse: (r: { data: InventoryItem }) => r.data,
      invalidatesTags: [{ type: 'Inventory', id: 'LIST' }],
    }),
    updateInventoryItem: build.mutation<
      InventoryItem,
      { id: string; patch: Partial<InventoryItem> }
    >({
      query: ({ id, patch }) => ({ url: `inventory/${id}`, method: 'PUT', body: patch }),
      transformResponse: (r: { data: InventoryItem }) => r.data,
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Inventory', id },
        { type: 'Inventory', id: 'LIST' },
      ],
    }),
    archiveInventoryItem: build.mutation<void, string>({
      query: (id) => ({ url: `inventory/${id}/archive`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'Inventory', id },
        { type: 'Inventory', id: 'LIST' },
      ],
    }),
    deleteInventoryItem: build.mutation<void, string>({
      query: (id) => ({ url: `inventory/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'Inventory', id },
        { type: 'Inventory', id: 'LIST' },
      ],
    }),
    adjustStock: build.mutation<InventoryItem, { id: string; delta: number; reason: string }>({
      query: ({ id, delta, reason }) => ({
        url: `inventory/${id}/adjust-stock`,
        method: 'POST',
        body: { delta, reason },
      }),
      transformResponse: (r: { data: InventoryItem }) => r.data,
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Inventory', id },
        { type: 'Inventory', id: 'LIST' },
        { type: 'InventoryTransaction', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useListInventoryQuery,
  useGetInventoryItemQuery,
  useCreateInventoryItemMutation,
  useUpdateInventoryItemMutation,
  useArchiveInventoryItemMutation,
  useDeleteInventoryItemMutation,
  useAdjustStockMutation,
} = inventoryApi;
