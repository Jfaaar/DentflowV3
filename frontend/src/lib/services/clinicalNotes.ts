// Clinical notes — thin fetch shim over /api/v1/clinical/notes.
import { http } from '../http';
import type { ClinicalNote } from '../../types';

interface ListOpts {
  page?: number;
  pageSize?: number;
  patientId?: string;
}

interface BackendPaged {
  data: ClinicalNote[];
  page: number;
  pageSize: number;
  total: number;
}

export const clinicalNotesService = {
  async list(opts: ListOpts = {}) {
    const r = await http<BackendPaged>('GET', 'clinical/notes', { params: opts });
    return { data: r.data, total: r.total };
  },

  async get(id: string) {
    try {
      return await http<ClinicalNote>('GET', `clinical/notes/${id}`);
    } catch (e: unknown) {
      if ((e as { status?: number }).status === 404) return null;
      throw e;
    }
  },

  async create(input: Omit<ClinicalNote, 'id' | 'clinicId' | 'createdAt' | 'updatedAt'>) {
    return http<ClinicalNote>('POST', 'clinical/notes', { body: input });
  },

  async update(id: string, input: Partial<ClinicalNote>) {
    return http<ClinicalNote>('PUT', `clinical/notes/${id}`, { body: input });
  },

  async sign(id: string): Promise<ClinicalNote> {
    return http<ClinicalNote>('POST', `clinical/notes/${id}/sign`);
  },

  async archive(id: string): Promise<void> {
    await http<void>('DELETE', `clinical/notes/${id}`);
  },
};

export type { ListOpts as ClinicalNotesListOpts };
