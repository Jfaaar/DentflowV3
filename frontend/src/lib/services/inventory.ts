// Inventory items — thin fetch shim over /api/v1/inventory.
import { http } from '../http';
import type { InventoryItem, InventoryItemType } from '../../types';

interface ListOpts {
  page?: number;
  pageSize?: number;
  search?: string;
  filters?: { type?: InventoryItemType; lowStock?: boolean };
}

interface BackendPaged {
  data: InventoryItem[];
  page: number;
  pageSize: number;
  total: number;
}

export const inventoryService = {
  async list(opts: ListOpts = {}) {
    const r = await http<BackendPaged>('GET', 'inventory', {
      params: {
        page: opts.page,
        pageSize: opts.pageSize,
        search: opts.search,
        type: opts.filters?.type,
      },
    });
    return { data: r.data, total: r.total };
  },

  async get(id: string) {
    try {
      return await http<InventoryItem>('GET', `inventory/${id}`);
    } catch (e: unknown) {
      if ((e as { status?: number }).status === 404) return null;
      throw e;
    }
  },

  async create(input: Omit<InventoryItem, 'id'>): Promise<InventoryItem> {
    return http<InventoryItem>('POST', 'inventory', { body: input });
  },

  async update(input: InventoryItem): Promise<InventoryItem> {
    const { id, ...patch } = input;
    return http<InventoryItem>('PUT', `inventory/${id}`, { body: patch });
  },

  async archive(id: string): Promise<void> {
    await http<void>('POST', `inventory/${id}/archive`);
  },

  async delete(id: string): Promise<void> {
    await http<void>('DELETE', `inventory/${id}`);
  },

  async adjustStock(id: string, delta: number, reason: string): Promise<InventoryItem> {
    return http<InventoryItem>('POST', `inventory/${id}/adjust-stock`, { body: { delta, reason } });
  },
};

export type { ListOpts as InventoryListOpts };
