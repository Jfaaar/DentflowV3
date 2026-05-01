/**
 * Clinical notes service. Talks to Supabase directly.
 *
 * Notes lifecycle:
 *   create -> edit -> sign() -> immutable (enforced by RLS in 0005).
 *
 * Phase 4 will move some of these calls behind the Express server, but Phase 3
 * uses the supabase client directly per the work plan.
 */
import { supabase } from '../supabase';
import type { ClinicalNote, Vitals } from '../../types';

const TABLE = 'clinical_notes';

interface RowShape {
  id: string;
  patient_id: string;
  appointment_id?: string | null;
  author_id: string;
  author_name?: string | null;
  reason?: string | null;
  symptoms?: string | null;
  diagnosis?: string | null;
  notes?: string | null;
  treatment_plan?: string | null;
  follow_up?: string | null;
  vitals?: Vitals | null;
  signed_at?: string | null;
  signed_by?: string | null;
  clinic_id: string;
  created_at: string;
  updated_at?: string | null;
}

const fromRow = (r: RowShape): ClinicalNote => ({
  id: r.id,
  patientId: r.patient_id,
  appointmentId: r.appointment_id ?? undefined,
  authorId: r.author_id,
  authorName: r.author_name ?? undefined,
  reason: r.reason ?? undefined,
  symptoms: r.symptoms ?? undefined,
  diagnosis: r.diagnosis ?? undefined,
  notes: r.notes ?? undefined,
  treatmentPlan: r.treatment_plan ?? undefined,
  followUp: r.follow_up ?? undefined,
  vitals: r.vitals ?? undefined,
  signedAt: r.signed_at ?? null,
  signedBy: r.signed_by ?? null,
  clinicId: r.clinic_id,
  createdAt: r.created_at,
  updatedAt: r.updated_at ?? undefined,
});

const toRow = (n: Partial<ClinicalNote>): Partial<RowShape> => ({
  id: n.id,
  patient_id: n.patientId,
  appointment_id: n.appointmentId ?? null,
  author_id: n.authorId,
  author_name: n.authorName ?? null,
  reason: n.reason ?? null,
  symptoms: n.symptoms ?? null,
  diagnosis: n.diagnosis ?? null,
  notes: n.notes ?? null,
  treatment_plan: n.treatmentPlan ?? null,
  follow_up: n.followUp ?? null,
  vitals: n.vitals ?? null,
  signed_at: n.signedAt ?? null,
  signed_by: n.signedBy ?? null,
  clinic_id: n.clinicId!,
});

export const clinicalService = {
  async list(patientId: string): Promise<ClinicalNote[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as RowShape[] | null)?.map(fromRow) ?? [];
  },

  async get(id: string): Promise<ClinicalNote | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      if ((error as any).code === 'PGRST116') return null;
      throw error;
    }
    return data ? fromRow(data as RowShape) : null;
  },

  async create(note: Omit<ClinicalNote, 'id' | 'createdAt'>): Promise<ClinicalNote> {
    const payload = toRow(note);
    const { data, error } = await supabase.from(TABLE).insert(payload).select().single();
    if (error) throw error;
    return fromRow(data as RowShape);
  },

  async update(id: string, patch: Partial<ClinicalNote>): Promise<ClinicalNote> {
    const row = toRow(patch);
    delete row.id;
    delete (row as any).created_at;
    const { data, error } = await supabase
      .from(TABLE)
      .update({ ...row, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return fromRow(data as RowShape);
  },

  /**
   * Lock the note. Sets signed_at = NOW() and the row becomes immutable
   * (enforced by RLS — see 0005_clinical_locks_and_triggers.sql).
   */
  async sign(id: string, signedBy: string): Promise<ClinicalNote> {
    const { data, error } = await supabase
      .from(TABLE)
      .update({
        signed_at: new Date().toISOString(),
        signed_by: signedBy,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return fromRow(data as RowShape);
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) throw error;
  },
};
