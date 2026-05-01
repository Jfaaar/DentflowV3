/**
 * Dental chart service. Each entry pins a finding to a tooth (FDI notation)
 * and optionally a surface. Multiple entries per tooth are allowed.
 */
import { supabase } from '../supabase';
import type { DentalChartEntry, ToothCondition } from '../../types';

const TABLE = 'dental_chart_entries';

interface RowShape {
  id: string;
  patient_id: string;
  tooth_id: string;
  surface?: string | null;
  condition: ToothCondition;
  note?: string | null;
  color?: string | null;
  clinic_id: string;
  author_id?: string | null;
  created_at: string;
}

const fromRow = (r: RowShape): DentalChartEntry => ({
  id: r.id,
  patientId: r.patient_id,
  toothId: r.tooth_id,
  surface: r.surface ?? undefined,
  condition: r.condition,
  note: r.note ?? undefined,
  color: r.color ?? undefined,
  clinicId: r.clinic_id,
  authorId: r.author_id ?? undefined,
  createdAt: r.created_at,
});

const toRow = (e: Partial<DentalChartEntry>): Partial<RowShape> => ({
  id: e.id,
  patient_id: e.patientId,
  tooth_id: e.toothId,
  surface: e.surface ?? null,
  condition: e.condition!,
  note: e.note ?? null,
  color: e.color ?? null,
  clinic_id: e.clinicId!,
  author_id: e.authorId ?? null,
});

export const dentalChartService = {
  async list(patientId: string): Promise<DentalChartEntry[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as RowShape[] | null)?.map(fromRow) ?? [];
  },

  /**
   * Insert or update by id. If `entry.id` is empty/undefined, an insert is
   * performed.
   */
  async upsert(entry: Partial<DentalChartEntry>): Promise<DentalChartEntry> {
    const row = toRow(entry);
    if (entry.id) {
      const { data, error } = await supabase
        .from(TABLE)
        .update(row)
        .eq('id', entry.id)
        .select()
        .single();
      if (error) throw error;
      return fromRow(data as RowShape);
    }
    delete row.id;
    const { data, error } = await supabase.from(TABLE).insert(row).select().single();
    if (error) throw error;
    return fromRow(data as RowShape);
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) throw error;
  },
};
