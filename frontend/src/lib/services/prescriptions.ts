// Prescriptions service — thin fetch shim over /api/v1/prescriptions.
import { http } from '../http';
import type { Prescription } from '../../types';

interface ListOpts {
  page?: number;
  pageSize?: number;
  patientId?: string;
}

interface BackendPaged {
  data: Prescription[];
  page: number;
  pageSize: number;
  total: number;
}

export const prescriptionsService = {
  async list(opts: ListOpts = {}) {
    const r = await http<BackendPaged>('GET', 'prescriptions', { params: opts });
    return { data: r.data, total: r.total };
  },

  async get(id: string) {
    try {
      return await http<Prescription>('GET', `prescriptions/${id}`);
    } catch (e: unknown) {
      if ((e as { status?: number }).status === 404) return null;
      throw e;
    }
  },

  async create(input: Omit<Prescription, 'id'>): Promise<Prescription> {
    return http<Prescription>('POST', 'prescriptions', { body: input });
  },

  async update(id: string, input: Partial<Prescription>): Promise<Prescription> {
    return http<Prescription>('PUT', `prescriptions/${id}`, { body: input });
  },

  async archive(id: string): Promise<void> {
    await http<void>('DELETE', `prescriptions/${id}`);
  },
};

export type { ListOpts as PrescriptionsListOpts };
