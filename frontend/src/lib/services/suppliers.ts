// Suppliers — thin fetch shim over /api/v1/suppliers.
import { http } from '../http';
import type { Supplier } from '../../types';

interface ListOpts {
  page?: number;
  pageSize?: number;
  search?: string;
}

interface BackendPaged {
  data: Supplier[];
  page: number;
  pageSize: number;
  total: number;
}

export const suppliersService = {
  async list(opts: ListOpts = {}) {
    const r = await http<BackendPaged>('GET', 'suppliers', { params: opts });
    return { data: r.data, total: r.total };
  },

  async get(id: string) {
    try {
      return await http<Supplier>('GET', `suppliers/${id}`);
    } catch (e: unknown) {
      if ((e as { status?: number }).status === 404) return null;
      throw e;
    }
  },

  async create(input: Omit<Supplier, 'id'>): Promise<Supplier> {
    return http<Supplier>('POST', 'suppliers', { body: input });
  },

  async update(input: Supplier): Promise<Supplier> {
    const { id, ...patch } = input;
    return http<Supplier>('PUT', `suppliers/${id}`, { body: patch });
  },

  async delete(id: string): Promise<void> {
    await http<void>('DELETE', `suppliers/${id}`);
  },

  async archive(id: string): Promise<void> {
    return this.delete(id);
  },
};

export type { ListOpts as SuppliersListOpts };
