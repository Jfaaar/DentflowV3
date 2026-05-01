/**
 * Suppliers service — Supabase-backed.
 */

import { supabase } from '../supabase';
import { cache } from '../cache';
import { getServiceContext } from './_context';
import type { Supplier } from '../../types';

const TABLE = 'suppliers';
const CACHE_PREFIX = 'cache:suppliers:';

interface DBSupplier {
  id: string;
  clinic_id: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
}

const fromDb = (row: DBSupplier): Supplier => ({
  id: row.id,
  name: row.name,
  contactPerson: row.contact_person ?? undefined,
  phone: row.phone ?? undefined,
  email: row.email ?? undefined,
  address: row.address ?? undefined,
});

const toDb = (s: Partial<Supplier>) => {
  const row: Record<string, unknown> = {};
  if (s.name !== undefined) row.name = s.name;
  if (s.contactPerson !== undefined) row.contact_person = s.contactPerson ?? null;
  if (s.phone !== undefined) row.phone = s.phone ?? null;
  if (s.email !== undefined) row.email = s.email ?? null;
  if (s.address !== undefined) row.address = s.address ?? null;
  return row;
};

interface ListOpts {
  page?: number;
  pageSize?: number;
  search?: string;
}

interface ListResult {
  data: Supplier[];
  total: number;
}

export const suppliersService = {
  async list(opts: ListOpts = {}): Promise<ListResult> {
    const page = opts.page ?? 0;
    const size = opts.pageSize ?? 200;
    const from = page * size;
    const to = from + size - 1;

    let q = supabase
      .from(TABLE)
      .select('*', { count: 'exact' })
      .order('name', { ascending: true })
      .range(from, to);
    if (opts.search && opts.search.trim()) {
      q = q.ilike('name', `%${opts.search.trim()}%`);
    }
    const { data, error, count } = await q;
    if (error) throw error;
    return {
      data: (data ?? []).map((r) => fromDb(r as DBSupplier)),
      total: count ?? 0,
    };
  },

  async get(id: string): Promise<Supplier | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? fromDb(data as DBSupplier) : null;
  },

  async create(input: Omit<Supplier, 'id'>): Promise<Supplier> {
    const { clinicId } = await getServiceContext();
    const { data, error } = await supabase
      .from(TABLE)
      .insert({ ...toDb(input), clinic_id: clinicId })
      .select('*')
      .single();
    if (error) throw error;
    cache.invalidate(CACHE_PREFIX);
    return fromDb(data as DBSupplier);
  },

  async update(input: Supplier): Promise<Supplier> {
    const { data, error } = await supabase
      .from(TABLE)
      .update(toDb(input))
      .eq('id', input.id)
      .select('*')
      .single();
    if (error) throw error;
    cache.invalidate(CACHE_PREFIX);
    return fromDb(data as DBSupplier);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) throw error;
    cache.invalidate(CACHE_PREFIX);
  },

  async archive(id: string): Promise<void> {
    return this.delete(id);
  },
};

export type { ListOpts as SuppliersListOpts, ListResult as SuppliersListResult };
