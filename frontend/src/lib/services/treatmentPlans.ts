// Treatment plans service — thin fetch shim over /api/v1/treatment-plans.
import { http } from '../http';
import type { TreatmentPlan } from '../../types';

interface ListOpts {
  page?: number;
  pageSize?: number;
  patientId?: string;
  filters?: { status?: TreatmentPlan['status'] };
}

interface BackendPaged {
  data: TreatmentPlan[];
  page: number;
  pageSize: number;
  total: number;
}

export const treatmentPlansService = {
  async list(opts: ListOpts = {}) {
    const r = await http<BackendPaged>('GET', 'treatment-plans', {
      params: {
        page: opts.page,
        pageSize: opts.pageSize,
        patientId: opts.patientId,
        status: opts.filters?.status,
      },
    });
    return { data: r.data, total: r.total };
  },

  async get(id: string) {
    try {
      return await http<TreatmentPlan>('GET', `treatment-plans/${id}`);
    } catch (e: unknown) {
      if ((e as { status?: number }).status === 404) return null;
      throw e;
    }
  },

  async create(input: Omit<TreatmentPlan, 'id' | 'clinicId'>) {
    return http<TreatmentPlan>('POST', 'treatment-plans', { body: input });
  },

  async update(id: string, input: Partial<TreatmentPlan>) {
    return http<TreatmentPlan>('PUT', `treatment-plans/${id}`, { body: input });
  },

  async archive(id: string) {
    await http<void>('POST', `treatment-plans/${id}/cancel`);
  },
};

export type { ListOpts as TreatmentPlansListOpts };
