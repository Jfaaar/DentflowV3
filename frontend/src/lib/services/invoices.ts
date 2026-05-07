// Invoices service — thin fetch shim over /api/v1/invoices.
import { http } from '../http';
import type { Invoice } from '../../types';

interface ListOpts {
  page?: number;
  pageSize?: number;
  patientId?: string;
  filters?: { status?: Invoice['status'] };
}

interface BackendPaged {
  data: Invoice[];
  page: number;
  pageSize: number;
  total: number;
}

export const invoicesService = {
  async list(opts: ListOpts = {}): Promise<{ data: Invoice[]; total: number }> {
    const r = await http<BackendPaged>('GET', 'invoices', {
      params: {
        page: opts.page,
        pageSize: opts.pageSize,
        patientId: opts.patientId,
        status: opts.filters?.status,
      },
    });
    return { data: r.data, total: r.total };
  },

  async get(id: string): Promise<Invoice | null> {
    try {
      return await http<Invoice>('GET', `invoices/${id}`);
    } catch (e: unknown) {
      if ((e as { status?: number }).status === 404) return null;
      throw e;
    }
  },

  async create(input: Omit<Invoice, 'id'>): Promise<Invoice> {
    return http<Invoice>('POST', 'invoices', { body: input });
  },

  async update(input: Invoice): Promise<Invoice> {
    const { id, ...patch } = input;
    return http<Invoice>('PUT', `invoices/${id}`, { body: patch });
  },

  async archive(id: string): Promise<void> {
    await http<void>('POST', `invoices/${id}/void`);
  },
};

export type { ListOpts as InvoicesListOpts };
