/**
 * Treatment Plans service — Supabase-backed.
 */

import { supabase } from '../supabase';
import { cache } from '../cache';
import { getServiceContext } from './_context';
import type { TreatmentPlan } from '../../types';

const TABLE = 'treatment_plans';
const CACHE_PREFIX = 'cache:treatment_plans:';

interface DBTreatmentPlan {
  id: string;
  clinic_id: string;
  patient_id: string;
  doctor_id: string | null;
  title: string | null;
  status: TreatmentPlan['status'];
  estimated_total: string | number | null;
  discount: string | number | null;
  insurance_covered: string | number | null;
  patient_responsibility: string | number | null;
  accepted_at: string | null;
}

const numOrUndef = (v: string | number | null | undefined): number | undefined =>
  v == null ? undefined : typeof v === 'number' ? v : Number(v);

const fromDb = (row: DBTreatmentPlan): TreatmentPlan => ({
  id: row.id,
  clinicId: row.clinic_id,
  patientId: row.patient_id,
  doctorId: row.doctor_id ?? undefined,
  title: row.title ?? undefined,
  status: row.status,
  estimatedTotal: numOrUndef(row.estimated_total),
  discount: numOrUndef(row.discount),
  insuranceCovered: numOrUndef(row.insurance_covered),
  patientResponsibility: numOrUndef(row.patient_responsibility),
  acceptedAt: row.accepted_at ?? undefined,
});

const toDb = (p: Partial<TreatmentPlan>) => {
  const row: Record<string, unknown> = {};
  if (p.patientId !== undefined) row.patient_id = p.patientId;
  if (p.doctorId !== undefined) row.doctor_id = p.doctorId ?? null;
  if (p.title !== undefined) row.title = p.title ?? null;
  if (p.status !== undefined) row.status = p.status;
  if (p.estimatedTotal !== undefined) row.estimated_total = p.estimatedTotal;
  if (p.discount !== undefined) row.discount = p.discount;
  if (p.insuranceCovered !== undefined) row.insurance_covered = p.insuranceCovered;
  if (p.patientResponsibility !== undefined)
    row.patient_responsibility = p.patientResponsibility;
  if (p.acceptedAt !== undefined) row.accepted_at = p.acceptedAt ?? null;
  return row;
};

interface ListOpts {
  page?: number;
  pageSize?: number;
  patientId?: string;
  filters?: { status?: TreatmentPlan['status'] };
}

interface ListResult {
  data: TreatmentPlan[];
  total: number;
}

export const treatmentPlansService = {
  async list(opts: ListOpts = {}): Promise<ListResult> {
    const page = opts.page ?? 0;
    const size = opts.pageSize ?? 50;
    const from = page * size;
    const to = from + size - 1;

    let q = supabase
      .from(TABLE)
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);
    if (opts.patientId) q = q.eq('patient_id', opts.patientId);
    if (opts.filters?.status) q = q.eq('status', opts.filters.status);

    const { data, error, count } = await q;
    if (error) throw error;
    return {
      data: (data ?? []).map((r) => fromDb(r as DBTreatmentPlan)),
      total: count ?? 0,
    };
  },

  async get(id: string): Promise<TreatmentPlan | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? fromDb(data as DBTreatmentPlan) : null;
  },

  async create(
    input: Omit<TreatmentPlan, 'id' | 'clinicId'>,
  ): Promise<TreatmentPlan> {
    const { clinicId } = await getServiceContext();
    const { data, error } = await supabase
      .from(TABLE)
      .insert({ ...toDb(input), clinic_id: clinicId })
      .select('*')
      .single();
    if (error) throw error;
    cache.invalidate(CACHE_PREFIX);
    return fromDb(data as DBTreatmentPlan);
  },

  async update(id: string, input: Partial<TreatmentPlan>): Promise<TreatmentPlan> {
    const { data, error } = await supabase
      .from(TABLE)
      .update(toDb(input))
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    cache.invalidate(CACHE_PREFIX);
    return fromDb(data as DBTreatmentPlan);
  },

  async archive(id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLE)
      .update({ status: 'canceled' })
      .eq('id', id);
    if (error) throw error;
    cache.invalidate(CACHE_PREFIX);
  },
};

export type { ListOpts as TreatmentPlansListOpts, ListResult as TreatmentPlansListResult };
