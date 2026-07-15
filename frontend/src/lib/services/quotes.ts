// Quotes service — thin fetch shim over /api/v1/quotes.
import { http } from '../http';
import type { Quote } from '../../types';

interface ListOpts {
  page?: number;
  pageSize?: number;
  patientId?: string;
}

interface BackendPaged {
  data: Quote[];
  page: number;
  pageSize: number;
  total: number;
}

export const quotesService = {
  async list(opts: ListOpts = {}) {
    const r = await http<BackendPaged>('GET', 'quotes', { params: opts });
    return { data: r.data, total: r.total };
  },

  async get(id: string) {
    try {
      return await http<Quote>('GET', `quotes/${id}`);
    } catch (e: unknown) {
      if ((e as { status?: number }).status === 404) return null;
      throw e;
    }
  },

  async create(input: Omit<Quote, 'id'>): Promise<Quote> {
    return http<Quote>('POST', 'quotes', { body: input });
  },

  async update(id: string, input: Partial<Quote>): Promise<Quote> {
    return http<Quote>('PUT', `quotes/${id}`, { body: input });
  },

  async archive(id: string): Promise<void> {
    await http<void>('POST', `quotes/${id}/expire`);
  },
};

export type { ListOpts as QuotesListOpts };
