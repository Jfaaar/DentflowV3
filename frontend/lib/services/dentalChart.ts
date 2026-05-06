/**
 * Dental Chart Entries service — Supabase-backed.
 */

import { supabase } from '../supabase';
import { cache } from '../cache';
import { getServiceContext } from './_context';
import type { DentalChartEntry } from '../../types';

const TABLE = 'dental_chart_entries';
const CACHE_PREFIX = 'cache:dental_chart:';

interface DBDentalChartEntry {
  id: string;
  clinic_id: string;
  patient_id: string;
  tooth: string;
  surface: string | null;
  finding: string;
  notes: string | null;
  recorded_at: string;
  recorded_by: string | null;
}

const fromDb = (row: DBDentalChartEntry): DentalChartEntry => ({
  id: row.id,
  clinicId: row.clinic_id,
  patientId: row.patient_id,
  tooth: row.tooth,
  surface: row.surface ?? undefined,
  finding: row.finding,
  notes: row.notes ?? undefined,
  recordedAt: row.recorded_at,
  recordedBy: row.recorded_by ?? undefined,
});

const toDb = (e: Partial<DentalChartEntry>) => {
  const row: Record<string, unknown> = {};
  if (e.patientId !== undefined) row.patient_id = e.patientId;
  if (e.tooth !== undefined) row.tooth = e.tooth;
  if (e.surface !== undefined) row.surface = e.surface ?? null;
  if (e.finding !== undefined) row.finding = e.finding;
  if (e.notes !== undefined) row.notes = e.notes ?? null;
  if (e.recordedAt !== undefined) row.recorded_at = e.recordedAt;
  if (e.recordedBy !== undefined) row.recorded_by = e.recordedBy ?? null;
  return row;
};

interface ListOpts {
  page?: number;
  pageSize?: number;
  patientId?: string;
}

interface ListResult {
  data: DentalChartEntry[];
  total: number;
}

export const dentalChartService = {
  async list(opts: ListOpts = {}): Promise<ListResult> {
    const page = opts.page ?? 0;
    const size = opts.pageSize ?? 200;
    const from = page * size;
    const to = from + size - 1;

    let q = supabase
      .from(TABLE)
      .select('*', { count: 'exact' })
      .order('recorded_at', { ascending: false })
      .range(from, to);
    if (opts.patientId) q = q.eq('patient_id', opts.patientId);

    const { data, error, count } = await q;
    if (error) throw error;
    return {
      data: (data ?? []).map((r) => fromDb(r as DBDentalChartEntry)),
      total: count ?? 0,
    };
  },

  async get(id: string): Promise<DentalChartEntry | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? fromDb(data as DBDentalChartEntry) : null;
  },

  async create(
    input: Omit<DentalChartEntry, 'id' | 'clinicId' | 'recordedAt'> & { recordedAt?: string },
  ): Promise<DentalChartEntry> {
    const { clinicId } = await getServiceContext();
    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        ...toDb(input),
        clinic_id: clinicId,
        recorded_at: input.recordedAt ?? new Date().toISOString(),
      })
      .select('*')
      .single();
    if (error) throw error;
    cache.invalidate(CACHE_PREFIX);
    return fromDb(data as DBDentalChartEntry);
  },

  async update(id: string, input: Partial<DentalChartEntry>): Promise<DentalChartEntry> {
    const { data, error } = await supabase
      .from(TABLE)
      .update(toDb(input))
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    cache.invalidate(CACHE_PREFIX);
    return fromDb(data as DBDentalChartEntry);
  },

  async archive(id: string): Promise<void> {
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) throw error;
    cache.invalidate(CACHE_PREFIX);
  },
};

export type { ListOpts as DentalChartListOpts, ListResult as DentalChartListResult };
