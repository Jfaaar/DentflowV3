/**
 * Prescriptions service — Supabase-backed.
 *
 * Items are stored in `prescription_items` and hydrated on read. Inventory
 * deduction (legacy behaviour: -1 unit per item line) is recorded as
 * `inventory_transactions` rows so reports stay consistent.
 */

import { supabase } from '../supabase';
import { cache } from '../cache';
import { getServiceContext } from './_context';
import type { Prescription, PrescriptionItem } from '../../types';

const TABLE = 'prescriptions';
const CACHE_PREFIX = 'cache:prescriptions:';

interface DBPrescription {
  id: string;
  clinic_id: string;
  patient_id: string;
  doctor_id: string | null;
  notes: string | null;
  signed_at: string | null;
  created_at: string;
}

interface DBPrescriptionItem {
  id: string;
  prescription_id: string;
  inventory_item_id: string | null;
  medication_name: string;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  notes: string | null;
}

const itemFromDb = (row: DBPrescriptionItem): PrescriptionItem => ({
  medicamentId: row.inventory_item_id ?? '',
  medicamentName: row.medication_name,
  dosage: row.dosage ?? '',
  frequency: row.frequency ?? '',
  duration: row.duration ?? '',
  note: row.notes ?? undefined,
});

const fromDb = (
  row: DBPrescription,
  items: DBPrescriptionItem[] = [],
): Prescription => ({
  id: row.id,
  patientId: row.patient_id,
  date: row.created_at,
  items: items.map(itemFromDb),
  notes: row.notes ?? undefined,
});

interface ListOpts {
  page?: number;
  pageSize?: number;
  patientId?: string;
}

interface ListResult {
  data: Prescription[];
  total: number;
}

const SELECT = '*, items:prescription_items(*)';

export const prescriptionsService = {
  async list(opts: ListOpts = {}): Promise<ListResult> {
    const page = opts.page ?? 0;
    const size = opts.pageSize ?? 50;
    const from = page * size;
    const to = from + size - 1;

    let q = supabase
      .from(TABLE)
      .select(SELECT, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);
    if (opts.patientId) q = q.eq('patient_id', opts.patientId);

    const { data, error, count } = await q;
    if (error) throw error;
    const rows = (data ?? []).map((r) => {
      const row = r as DBPrescription & { items?: DBPrescriptionItem[] };
      return fromDb(row, row.items ?? []);
    });
    return { data: rows, total: count ?? 0 };
  },

  async get(id: string): Promise<Prescription | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .select(SELECT)
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const row = data as DBPrescription & { items?: DBPrescriptionItem[] };
    return fromDb(row, row.items ?? []);
  },

  async create(input: Omit<Prescription, 'id'>): Promise<Prescription> {
    const { clinicId } = await getServiceContext();
    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        clinic_id: clinicId,
        patient_id: input.patientId,
        notes: input.notes ?? null,
      })
      .select('*')
      .single();
    if (error) throw error;

    const prescriptionId = (data as DBPrescription).id;

    if (input.items.length > 0) {
      const itemRows = input.items.map((it) => ({
        clinic_id: clinicId,
        prescription_id: prescriptionId,
        inventory_item_id: it.medicamentId || null,
        medication_name: it.medicamentName,
        dosage: it.dosage || null,
        frequency: it.frequency || null,
        duration: it.duration || null,
        notes: it.note ?? null,
      }));
      const { error: itemErr } = await supabase
        .from('prescription_items')
        .insert(itemRows);
      if (itemErr) throw itemErr;

      // Inventory deduction for items linked to a real inventory entry.
      const txRows = input.items
        .filter((it) => it.medicamentId)
        .map((it) => ({
          clinic_id: clinicId,
          item_id: it.medicamentId,
          type: 'usage',
          quantity: -1,
          reason: 'Prescription',
          reference_id: prescriptionId,
        }));
      if (txRows.length > 0) {
        await supabase.from('inventory_transactions').insert(txRows);
        cache.invalidate('cache:inventory:');
      }
    }

    cache.invalidate(CACHE_PREFIX);
    const created = await this.get(prescriptionId);
    return created!;
  },

  async update(id: string, input: Partial<Prescription>): Promise<Prescription> {
    const row: Record<string, unknown> = {};
    if (input.notes !== undefined) row.notes = input.notes ?? null;
    const { error } = await supabase
      .from(TABLE)
      .update(row)
      .eq('id', id);
    if (error) throw error;
    cache.invalidate(CACHE_PREFIX);
    const updated = await this.get(id);
    return updated!;
  },

  async archive(id: string): Promise<void> {
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) throw error;
    cache.invalidate(CACHE_PREFIX);
  },
};

export type { ListOpts as PrescriptionsListOpts, ListResult as PrescriptionsListResult };
