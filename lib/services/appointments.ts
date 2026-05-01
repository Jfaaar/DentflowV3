/**
 * Appointments service — Supabase-backed.
 */

import { supabase } from '../supabase';
import { cache } from '../cache';
import { getServiceContext } from './_context';
import type { Appointment, AppointmentStatus } from '../../types';

const TABLE = 'appointments';
const CACHE_PREFIX = 'cache:appointments:';

interface DBAppointment {
  id: string;
  clinic_id: string;
  patient_id: string;
  doctor_id: string | null;
  starts_at: string;
  ends_at: string;
  status: AppointmentStatus;
  observation: string | null;
  cancellation_reason: string | null;
  created_at: string;
}

interface DBAppointmentWithPatient extends DBAppointment {
  patient?: { full_name: string | null } | null;
}

const fromDb = (row: DBAppointmentWithPatient): Appointment => ({
  id: row.id,
  patientId: row.patient_id,
  patientName: row.patient?.full_name ?? '',
  start: row.starts_at,
  end: row.ends_at,
  status: row.status,
  observation: row.observation ?? undefined,
  createdAt: row.created_at,
});

const toDb = (a: Partial<Appointment>) => {
  const row: Record<string, unknown> = {};
  if (a.patientId !== undefined) row.patient_id = a.patientId;
  if (a.start !== undefined) row.starts_at = a.start;
  if (a.end !== undefined) row.ends_at = a.end;
  if (a.status !== undefined) row.status = a.status;
  if (a.observation !== undefined) row.observation = a.observation || null;
  return row;
};

interface ListOpts {
  page?: number;
  pageSize?: number;
  patientId?: string;
  filters?: { status?: AppointmentStatus; from?: string; to?: string };
}

interface ListResult {
  data: Appointment[];
  total: number;
}

const SELECT_WITH_PATIENT = '*, patient:patients(full_name)';

export const appointmentsService = {
  async list(opts: ListOpts = {}): Promise<ListResult> {
    const page = opts.page ?? 0;
    const size = opts.pageSize ?? 200;
    const from = page * size;
    const to = from + size - 1;

    let q = supabase
      .from(TABLE)
      .select(SELECT_WITH_PATIENT, { count: 'exact' })
      .order('starts_at', { ascending: true })
      .range(from, to);

    if (opts.patientId) q = q.eq('patient_id', opts.patientId);
    if (opts.filters?.status) q = q.eq('status', opts.filters.status);
    if (opts.filters?.from) q = q.gte('starts_at', opts.filters.from);
    if (opts.filters?.to) q = q.lte('starts_at', opts.filters.to);

    const { data, error, count } = await q;
    if (error) throw error;
    const rows = (data ?? []).map((r) => fromDb(r as DBAppointmentWithPatient));
    return { data: rows, total: count ?? 0 };
  },

  async get(id: string): Promise<Appointment | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .select(SELECT_WITH_PATIENT)
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? fromDb(data as DBAppointmentWithPatient) : null;
  },

  async create(input: Omit<Appointment, 'id' | 'createdAt'>): Promise<Appointment> {
    const { clinicId } = await getServiceContext();
    const row = { ...toDb(input), clinic_id: clinicId };
    const { data, error } = await supabase
      .from(TABLE)
      .insert(row)
      .select(SELECT_WITH_PATIENT)
      .single();
    if (error) throw error;
    cache.invalidate(CACHE_PREFIX);
    return fromDb(data as DBAppointmentWithPatient);
  },

  async update(input: Partial<Appointment> & { id: string }): Promise<Appointment> {
    const { data, error } = await supabase
      .from(TABLE)
      .update(toDb(input))
      .eq('id', input.id)
      .select(SELECT_WITH_PATIENT)
      .single();
    if (error) throw error;
    cache.invalidate(CACHE_PREFIX);
    return fromDb(data as DBAppointmentWithPatient);
  },

  async cancel(id: string, reason?: string): Promise<void> {
    const { error } = await supabase
      .from(TABLE)
      .update({
        status: 'canceled',
        cancellation_reason: reason ?? null,
      })
      .eq('id', id);
    if (error) throw error;
    cache.invalidate(CACHE_PREFIX);
  },

  async restore(id: string): Promise<Appointment> {
    return this.update({ id, status: 'pending' });
  },

  async cancelMany(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const { error } = await supabase
      .from(TABLE)
      .update({ status: 'canceled' })
      .in('id', ids);
    if (error) throw error;
    cache.invalidate(CACHE_PREFIX);
  },

  async archive(id: string): Promise<void> {
    return this.cancel(id);
  },
};

export type { ListOpts as AppointmentsListOpts, ListResult as AppointmentsListResult };
