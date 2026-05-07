// Inventory transactions — thin fetch shim over /api/v1/inventory-transactions.
import { http } from '../http';
import type { InventoryTransaction } from '../../types';

interface ListOpts {
  page?: number;
  pageSize?: number;
  itemId?: string;
}

interface BackendPaged {
  data: InventoryTransaction[];
  page: number;
  pageSize: number;
  total: number;
}

export const inventoryTransactionsService = {
  async list(opts: ListOpts = {}) {
    const r = await http<BackendPaged>('GET', 'inventory-transactions', { params: opts });
    return { data: r.data, total: r.total };
  },

  async get(id: string) {
    try {
      return await http<InventoryTransaction>('GET', `inventory-transactions/${id}`);
    } catch (e: unknown) {
      if ((e as { status?: number }).status === 404) return null;
      throw e;
    }
  },

  async create(input: Omit<InventoryTransaction, 'id'>): Promise<InventoryTransaction> {
    return http<InventoryTransaction>('POST', 'inventory-transactions', { body: input });
  },

  async update(): Promise<never> {
    throw new Error('inventory_transactions are append-only');
  },

  async archive(id: string): Promise<void> {
    await http<void>('DELETE', `inventory-transactions/${id}`);
  },
};

export type { ListOpts as InventoryTxnListOpts };
