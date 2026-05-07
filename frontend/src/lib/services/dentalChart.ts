// Dental chart entries — thin fetch shim over /api/v1/clinical/dental-chart.
import { http } from '../http';
import type { DentalChartEntry } from '../../types';

interface ListOpts {
  page?: number;
  pageSize?: number;
  patientId?: string;
}

interface BackendPaged {
  data: DentalChartEntry[];
  page: number;
  pageSize: number;
  total: number;
}

export const dentalChartService = {
  async list(opts: ListOpts = {}) {
    const r = await http<BackendPaged>('GET', 'clinical/dental-chart', { params: opts });
    return { data: r.data, total: r.total };
  },

  async get(id: string) {
    try {
      return await http<DentalChartEntry>('GET', `clinical/dental-chart/${id}`);
    } catch (e: unknown) {
      if ((e as { status?: number }).status === 404) return null;
      throw e;
    }
  },

  async create(input: Omit<DentalChartEntry, 'id' | 'clinicId' | 'recordedAt'> & { recordedAt?: string }) {
    return http<DentalChartEntry>('POST', 'clinical/dental-chart', { body: input });
  },

  async update(id: string, input: Partial<DentalChartEntry>) {
    return http<DentalChartEntry>('PUT', `clinical/dental-chart/${id}`, { body: input });
  },

  async archive(id: string) {
    await http<void>('DELETE', `clinical/dental-chart/${id}`);
  },
};

export type { ListOpts as DentalChartListOpts };
