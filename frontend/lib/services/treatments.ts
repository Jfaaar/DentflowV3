/**
 * Treatments service — Supabase-backed.
 *
 * Materials consumption (the legacy `materialsUsed[]` field) is recorded in
 * `inventory_transactions` separately. The DB trigger
 * `deduct_treatment_materials()` (Phase 3) will eventually take this over.
 */

import { supabase } from '../supabase';
import { cache } from '../cache';
import { getServiceContext } from './_context';
import type { Treatment, ConsumedMaterial } from '../../types';

const TABLE = 'treatments';
const CACHE_PREFIX = 'cache:treatments:';

interface DBTreatment {
  id: string;
  clinic_id: string;
  patient_id: string;
  plan_id: string | null;
  appointment_id: string | null;
  doctor_id: string | null;
  tooth: string | null;
  surface: string | null;
  description: string;
  price: string | number;
  status: 'planned' | 'in_progress' | 'completed' | 'canceled';
  performed_at: string | null;
  created_at: string;
}

const num = (v: string | number | null | undefined): number =>
  v == null ? 0 : typeof v === 'number' ? v : Number(v) || 0;

const fromDb = (row: DBTreatment, materials?: ConsumedMaterial[]): Treatment => ({
  id: row.id,
  patientId: row.patient_id,
  date: row.performed_at ?? row.created_at,
  tooth: row.tooth ?? undefined,
  surface: row.surface ?? undefined,
  description: row.description,
  price: num(row.price),
  status: row.status === 'completed' ? 'completed' : 'planned',
  materialsUsed: materials,
});

interface ListOpts {
  page?: number;
  pageSize?: number;
  patientId?: string;
}

interface ListResult {
  data: Treatment[];
  total: number;
}

export const treatmentsService = {
  async list(opts: ListOpts = {}): Promise<ListResult> {
    const page = opts.page ?? 0;
    const size = opts.pageSize ?? 200;
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
      data: (data ?? []).map((r) => fromDb(r as DBTreatment)),
      total: count ?? 0,
    };
  },

  async get(id: string): Promise<Treatment | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? fromDb(data as DBTreatment) : null;
  },

  async create(input: Omit<Treatment, 'id'>): Promise<Treatment> {
    const { clinicId } = await getServiceContext();
    const row = {
      clinic_id: clinicId,
      patient_id: input.patientId,
      tooth: input.tooth ?? null,
      surface: input.surface ?? null,
      description: input.description,
      price: input.price,
      status: input.status,
      performed_at:
        input.status === 'completed'
          ? input.date ?? new Date().toISOString()
          : null,
    };
    const { data, error } = await supabase
      .from(TABLE)
      .insert(row)
      .select('*')
      .single();
    if (error) throw error;

    const created = fromDb(data as DBTreatment, input.materialsUsed);

    // Material deduction — done client-side until the DB trigger ships.
    if (
      input.status === 'completed' &&
      input.materialsUsed &&
      input.materialsUsed.length > 0
    ) {
      const txRows = input.materialsUsed.map((m) => ({
        clinic_id: clinicId,
        item_id: m.itemId,
        type: 'usage',
        quantity: -Math.abs(m.quantity),
        reason: `Clinical Use: ${input.description}`,
        reference_id: created.id,
      }));
      await supabase.from('inventory_transactions').insert(txRows);
      cache.invalidate('cache:inventory:');
    }

    cache.invalidate(CACHE_PREFIX);
    return created;
  },

  async update(id: string, input: Partial<Treatment>): Promise<Treatment> {
    const row: Record<string, unknown> = {};
    if (input.tooth !== undefined) row.tooth = input.tooth ?? null;
    if (input.surface !== undefined) row.surface = input.surface ?? null;
    if (input.description !== undefined) row.description = input.description;
    if (input.price !== undefined) row.price = input.price;
    if (input.status !== undefined) {
      row.status = input.status;
      row.performed_at =
        input.status === 'completed'
          ? input.date ?? new Date().toISOString()
          : null;
    }
    const { data, error } = await supabase
      .from(TABLE)
      .update(row)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    cache.invalidate(CACHE_PREFIX);
    return fromDb(data as DBTreatment);
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

export type { ListOpts as TreatmentsListOpts, ListResult as TreatmentsListResult };
