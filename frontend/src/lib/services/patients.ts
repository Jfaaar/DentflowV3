// Patients service — thin fetch shim over /api/v1/patients.
import { http } from '../http';
import type { Patient } from '../../types';

interface ListOpts {
  page?: number;
  pageSize?: number;
  search?: string;
  filters?: { status?: 'active' | 'archived' };
}

interface ListResult {
  data: Patient[];
  total: number;
}

interface BackendPaged {
  data: Patient[];
  page: number;
  pageSize: number;
  total: number;
}

export const patientsService = {
  async list(opts: ListOpts = {}): Promise<ListResult> {
    const r = await http<BackendPaged>('GET', 'patients', {
      params: {
        page: opts.page,
        pageSize: opts.pageSize,
        search: opts.search,
        status: opts.filters?.status,
      },
    });
    return { data: r.data, total: r.total };
  },

  async get(id: string): Promise<Patient | null> {
    try {
      return await http<Patient>('GET', `patients/${id}`);
    } catch (e: unknown) {
      if ((e as { status?: number }).status === 404) return null;
      throw e;
    }
  },

  async create(input: Omit<Patient, 'id' | 'createdAt'>): Promise<Patient> {
    return http<Patient>('POST', 'patients', { body: input });
  },

  async update(input: Patient): Promise<Patient> {
    const { id, createdAt, ...patch } = input;
    void createdAt;
    return http<Patient>('PUT', `patients/${id}`, { body: patch });
  },

  async archive(id: string): Promise<void> {
    await http<void>('POST', `patients/${id}/archive`);
  },

  async delete(id: string): Promise<void> {
    await http<void>('DELETE', `patients/${id}`);
  },
};

export type { ListOpts as PatientsListOpts, ListResult as PatientsListResult };
