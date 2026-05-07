// Appointments service — thin fetch shim over /api/v1/appointments.
import { http } from '../http';
import type { Appointment, AppointmentStatus } from '../../types';

interface ListOpts {
  page?: number;
  pageSize?: number;
  patientId?: string;
  filters?: { status?: AppointmentStatus; from?: string; to?: string };
}

interface BackendPaged {
  data: Appointment[];
  page: number;
  pageSize: number;
  total: number;
}

export const appointmentsService = {
  async list(opts: ListOpts = {}): Promise<{ data: Appointment[]; total: number }> {
    const r = await http<BackendPaged>('GET', 'appointments', {
      params: {
        page: opts.page,
        pageSize: opts.pageSize,
        patientId: opts.patientId,
        status: opts.filters?.status,
        from: opts.filters?.from,
        to: opts.filters?.to,
      },
    });
    return { data: r.data, total: r.total };
  },

  async get(id: string): Promise<Appointment | null> {
    try {
      return await http<Appointment>('GET', `appointments/${id}`);
    } catch (e: unknown) {
      if ((e as { status?: number }).status === 404) return null;
      throw e;
    }
  },

  async create(input: Omit<Appointment, 'id' | 'createdAt'>): Promise<Appointment> {
    return http<Appointment>('POST', 'appointments', { body: input });
  },

  async update(input: Partial<Appointment> & { id: string }): Promise<Appointment> {
    const { id, ...patch } = input;
    return http<Appointment>('PUT', `appointments/${id}`, { body: patch });
  },

  async cancel(id: string, reason?: string): Promise<void> {
    await http<void>('POST', `appointments/${id}/cancel`, { body: { reason } });
  },

  async cancelMany(ids: string[]): Promise<void> {
    if (!ids.length) return;
    await http<void>('POST', 'appointments/cancel-many', { body: { ids } });
  },

  async restore(id: string): Promise<Appointment> {
    return http<Appointment>('POST', `appointments/${id}/restore`);
  },

  async archive(id: string): Promise<void> {
    return this.cancel(id);
  },
};

export type { ListOpts as AppointmentsListOpts };
