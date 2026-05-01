/**
 * Patients service — Supabase-backed.
 *
 * Column convention: snake_case in DB, camelCase in TS. The mapper here is
 * intentionally hand-rolled per service (no generic mapper) so unfamiliar
 * fields are an explicit choice, not silent passthrough.
 */

import { supabase } from '../supabase';
import { cache } from '../cache';
import { getServiceContext } from './_context';
import type { Patient, MedicalHistory } from '../../types';

const TABLE = 'patients';
const CACHE_PREFIX = 'cache:patients:';

interface DBPatient {
  id: string;
  clinic_id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  birth_date: string | null;
  gender: 'male' | 'female' | 'other' | null;
  address: string | null;
  profile_picture: string | null;
  insurance_provider: string | null;
  insurance_number: string | null;
  status: 'active' | 'archived' | 'deceased' | 'transferred';
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

const fromDb = (row: DBPatient, mh?: MedicalHistory): Patient => ({
  id: row.id,
  name: row.full_name,
  phone: row.phone ?? '',
  email: row.email ?? undefined,
  profilePicture: row.profile_picture ?? undefined,
  address: row.address ?? undefined,
  birthDate: row.birth_date ?? undefined,
  gender:
    row.gender === 'male' || row.gender === 'female' ? row.gender : undefined,
  insuranceProvider: row.insurance_provider ?? undefined,
  status: row.status === 'active' || row.status === 'archived' ? row.status : 'active',
  createdAt: row.created_at,
  medicalHistory: mh,
});

const toDb = (p: Partial<Patient>, clinicId: string) => {
  const row: Record<string, unknown> = {};
  if (p.name !== undefined) row.full_name = p.name;
  if (p.phone !== undefined) row.phone = p.phone || null;
  if (p.email !== undefined) row.email = p.email || null;
  if (p.profilePicture !== undefined) row.profile_picture = p.profilePicture || null;
  if (p.address !== undefined) row.address = p.address || null;
  if (p.birthDate !== undefined) row.birth_date = p.birthDate || null;
  if (p.gender !== undefined) row.gender = p.gender || null;
  if (p.insuranceProvider !== undefined) row.insurance_provider = p.insuranceProvider || null;
  if (p.status !== undefined) {
    row.status = p.status;
    row.archived_at = p.status === 'archived' ? new Date().toISOString() : null;
  }
  if (clinicId) row.clinic_id = clinicId;
  return row;
};

interface ListOpts {
  page?: number;
  pageSize?: number;
  search?: string;
  filters?: { status?: 'active' | 'archived' };
}

interface ListResult {
  data: Patient[];
  total: number;
}

export const patientsService = {
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

    if (opts.filters?.status) {
      q = q.eq('status', opts.filters.status);
    }

    if (opts.search && opts.search.trim()) {
      const term = opts.search.trim();
      // gin_trgm index covers full_name; phone/email use btree on (clinic_id, *)
      q = q.or(
        `full_name.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%`,
      );
    }

    const { data, error, count } = await q;
    if (error) throw error;
    const rows = (data ?? []).map((r) => fromDb(r as DBPatient));
    return { data: rows, total: count ?? 0 };
  },

  async get(id: string): Promise<Patient | null> {
    const cacheKey = `${CACHE_PREFIX}id:${id}`;
    const cached = cache.read<Patient>(cacheKey);
    if (cached) return cached;

    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;

    const { data: mh } = await supabase
      .from('patient_medical_history')
      .select('*')
      .eq('patient_id', id)
      .maybeSingle();

    const patient = fromDb(
      data as DBPatient,
      mh
        ? {
            allergies: mh.allergies ?? [],
            conditions: mh.conditions ?? [],
            medications: mh.medications ?? [],
            notes: mh.notes ?? undefined,
          }
        : undefined,
    );
    cache.write(cacheKey, patient);
    return patient;
  },

  async create(input: Omit<Patient, 'id' | 'createdAt'>): Promise<Patient> {
    const { clinicId } = await getServiceContext();
    const row = toDb({ ...input, status: input.status ?? 'active' }, clinicId);
    const { data, error } = await supabase
      .from(TABLE)
      .insert(row)
      .select('*')
      .single();
    if (error) throw error;
    cache.invalidate(CACHE_PREFIX);
    return fromDb(data as DBPatient);
  },

  async update(input: Patient): Promise<Patient> {
    const row = toDb(input, '');
    delete (row as Record<string, unknown>).clinic_id; // never overwrite tenant
    const { data, error } = await supabase
      .from(TABLE)
      .update(row)
      .eq('id', input.id)
      .select('*')
      .single();
    if (error) throw error;
    cache.invalidate(CACHE_PREFIX);
    return fromDb(data as DBPatient);
  },

  async archive(id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLE)
      .update({ status: 'archived', archived_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    cache.invalidate(CACHE_PREFIX);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) throw error;
    cache.invalidate(CACHE_PREFIX);
  },
};

export type { ListOpts as PatientsListOpts, ListResult as PatientsListResult };
