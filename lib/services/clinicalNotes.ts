/**
 * Clinical Notes service — Supabase-backed.
 *
 * Once `signed_at IS NOT NULL`, the row is intended to be RLS-locked
 * (see Phase 3 §3.2). The service still surfaces `update`, but the DB will
 * reject mutations on signed rows.
 */

import { supabase } from '../supabase';
import { cache } from '../cache';
import { getServiceContext } from './_context';
import type { ClinicalNote } from '../../types';

const TABLE = 'clinical_notes';
const CACHE_PREFIX = 'cache:clinical_notes:';

interface DBClinicalNote {
  id: string;
  clinic_id: string;
  patient_id: string;
  doctor_id: string;
  appointment_id: string | null;
  consultation_reason: string | null;
  symptoms: string | null;
  diagnosis: string | null;
  notes: string | null;
  treatment_plan: string | null;
  follow_up: string | null;
  vitals: Record<string, number | string> | null;
  signed_at: string | null;
  created_at: string;
  updated_at: string;
}

const fromDb = (row: DBClinicalNote): ClinicalNote => ({
  id: row.id,
  clinicId: row.clinic_id,
  patientId: row.patient_id,
  doctorId: row.doctor_id,
  appointmentId: row.appointment_id ?? undefined,
  consultationReason: row.consultation_reason ?? undefined,
  symptoms: row.symptoms ?? undefined,
  diagnosis: row.diagnosis ?? undefined,
  notes: row.notes ?? undefined,
  treatmentPlan: row.treatment_plan ?? undefined,
  followUp: row.follow_up ?? undefined,
  vitals: row.vitals ?? undefined,
  signedAt: row.signed_at ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toDb = (n: Partial<ClinicalNote>) => {
  const row: Record<string, unknown> = {};
  if (n.patientId !== undefined) row.patient_id = n.patientId;
  if (n.doctorId !== undefined) row.doctor_id = n.doctorId;
  if (n.appointmentId !== undefined) row.appointment_id = n.appointmentId ?? null;
  if (n.consultationReason !== undefined)
    row.consultation_reason = n.consultationReason ?? null;
  if (n.symptoms !== undefined) row.symptoms = n.symptoms ?? null;
  if (n.diagnosis !== undefined) row.diagnosis = n.diagnosis ?? null;
  if (n.notes !== undefined) row.notes = n.notes ?? null;
  if (n.treatmentPlan !== undefined) row.treatment_plan = n.treatmentPlan ?? null;
  if (n.followUp !== undefined) row.follow_up = n.followUp ?? null;
  if (n.vitals !== undefined) row.vitals = n.vitals ?? null;
  if (n.signedAt !== undefined) row.signed_at = n.signedAt ?? null;
  return row;
};

interface ListOpts {
  page?: number;
  pageSize?: number;
  patientId?: string;
}

interface ListResult {
  data: ClinicalNote[];
  total: number;
}

export const clinicalNotesService = {
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

    const { data, error, count } = await q;
    if (error) throw error;
    return {
      data: (data ?? []).map((r) => fromDb(r as DBClinicalNote)),
      total: count ?? 0,
    };
  },

  async get(id: string): Promise<ClinicalNote | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? fromDb(data as DBClinicalNote) : null;
  },

  async create(
    input: Omit<ClinicalNote, 'id' | 'clinicId' | 'createdAt' | 'updatedAt'>,
  ): Promise<ClinicalNote> {
    const { clinicId } = await getServiceContext();
    const { data, error } = await supabase
      .from(TABLE)
      .insert({ ...toDb(input), clinic_id: clinicId })
      .select('*')
      .single();
    if (error) throw error;
    cache.invalidate(CACHE_PREFIX);
    return fromDb(data as DBClinicalNote);
  },

  async update(id: string, input: Partial<ClinicalNote>): Promise<ClinicalNote> {
    const { data, error } = await supabase
      .from(TABLE)
      .update(toDb(input))
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    cache.invalidate(CACHE_PREFIX);
    return fromDb(data as DBClinicalNote);
  },

  async sign(id: string): Promise<ClinicalNote> {
    return this.update(id, { signedAt: new Date().toISOString() });
  },

  async archive(id: string): Promise<void> {
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) throw error;
    cache.invalidate(CACHE_PREFIX);
  },
};

export type { ListOpts as ClinicalNotesListOpts, ListResult as ClinicalNotesListResult };
