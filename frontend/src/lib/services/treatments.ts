// Treatments service — thin fetch shim over /api/v1/treatments.
import { http } from '../http';
import type { Treatment } from '../../types';

interface ListOpts {
  page?: number;
  pageSize?: number;
  patientId?: string;
}

interface BackendPaged {
  data: Treatment[];
  page: number;
  pageSize: number;
  total: number;
}

export const treatmentsService = {
  async list(opts: ListOpts = {}) {
    const r = await http<BackendPaged>('GET', 'treatments', { params: opts });
    return { data: r.data, total: r.total };
  },

  async get(id: string) {
    try {
      return await http<Treatment>('GET', `treatments/${id}`);
    } catch (e: unknown) {
      if ((e as { status?: number }).status === 404) return null;
      throw e;
    }
  },

  async create(input: Omit<Treatment, 'id'>): Promise<Treatment> {
    return http<Treatment>('POST', 'treatments', { body: input });
  },

  async update(id: string, input: Partial<Treatment>): Promise<Treatment> {
    return http<Treatment>('PUT', `treatments/${id}`, { body: input });
  },

  async archive(id: string): Promise<void> {
    await http<void>('POST', `treatments/${id}/cancel`);
  },
};

export type { ListOpts as TreatmentsListOpts };
