export {
  inventoryApi,
  useListInventoryQuery,
  useGetInventoryItemQuery,
  useCreateInventoryItemMutation,
  useUpdateInventoryItemMutation,
  useArchiveInventoryItemMutation,
  useDeleteInventoryItemMutation,
  useAdjustStockMutation,
} from './api/inventoryApi';
export type { InventoryItem, InventoryItemType } from './api/inventoryApi';

export {
  suppliersApi,
  useListSuppliersQuery,
  useGetSupplierQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
} from './api/suppliersApi';
export type { Supplier } from './api/suppliersApi';

export {
  inventoryTransactionsApi,
  useListInventoryTransactionsQuery,
  useCreateInventoryTransactionMutation,
  useDeleteInventoryTransactionMutation,
} from './api/inventoryTransactionsApi';
export type { InventoryTransaction } from './api/inventoryTransactionsApi';
