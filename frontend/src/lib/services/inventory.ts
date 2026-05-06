/**
 * Inventory Items service — Supabase-backed.
 */

import { supabase } from '../supabase';
import { cache } from '../cache';
import { getServiceContext } from './_context';
import type { InventoryItem, InventoryItemType } from '../../types';

const TABLE = 'inventory_items';
const CACHE_PREFIX = 'cache:inventory:';

interface DBInventoryItem {
  id: string;
  clinic_id: string;
  supplier_id: string | null;
  name: string;
  type: InventoryItemType;
  category: string | null;
  stock: string | number;
  min_stock: string | number;
  unit: string | null;
  cost_price: string | number | null;
  sell_price: string | number | null;
  expiry_date: string | null;
  brand: string | null;
  serial_number: string | null;
  last_maintenance: string | null;
  location: string | null;
  archived_at: string | null;
  created_at: string;
}

const num = (v: string | number | null | undefined): number =>
  v == null ? 0 : typeof v === 'number' ? v : Number(v) || 0;

const numOrUndef = (v: string | number | null | undefined): number | undefined =>
  v == null ? undefined : typeof v === 'number' ? v : Number(v);

const fromDb = (row: DBInventoryItem & { supplier?: { name: string | null } | null }): InventoryItem => ({
  id: row.id,
  name: row.name,
  type: row.type,
  category: row.category ?? undefined,
  stock: num(row.stock),
  minStock: num(row.min_stock),
  supplier: row.supplier?.name ?? undefined,
  price: numOrUndef(row.cost_price),
  description: undefined,
  form: row.unit ?? undefined,
  expiryDate: row.expiry_date ?? undefined,
  brand: row.brand ?? undefined,
  serialNumber: row.serial_number ?? undefined,
  lastMaintenance: row.last_maintenance ?? undefined,
  location: row.location ?? undefined,
});

const toDb = (i: Partial<InventoryItem>) => {
  const row: Record<string, unknown> = {};
  if (i.name !== undefined) row.name = i.name;
  if (i.type !== undefined) row.type = i.type;
  if (i.category !== undefined) row.category = i.category ?? null;
  if (i.stock !== undefined) row.stock = i.stock;
  if (i.minStock !== undefined) row.min_stock = i.minStock;
  if (i.price !== undefined) row.cost_price = i.price ?? null;
  if (i.form !== undefined) row.unit = i.form ?? null;
  if (i.expiryDate !== undefined) row.expiry_date = i.expiryDate || null;
  if (i.brand !== undefined) row.brand = i.brand ?? null;
  if (i.serialNumber !== undefined) row.serial_number = i.serialNumber ?? null;
  if (i.lastMaintenance !== undefined) row.last_maintenance = i.lastMaintenance || null;
  if (i.location !== undefined) row.location = i.location ?? null;
  return row;
};

interface ListOpts {
  page?: number;
  pageSize?: number;
  search?: string;
  filters?: { type?: InventoryItemType; lowStock?: boolean };
}

interface ListResult {
  data: InventoryItem[];
  total: number;
}

const SELECT = '*, supplier:suppliers(name)';

export const inventoryService = {
  async list(opts: ListOpts = {}): Promise<ListResult> {
    const page = opts.page ?? 0;
    const size = opts.pageSize ?? 200;
    const from = page * size;
    const to = from + size - 1;

    let q = supabase
      .from(TABLE)
      .select(SELECT, { count: 'exact' })
      .is('archived_at', null)
      .order('name', { ascending: true })
      .range(from, to);

    if (opts.filters?.type) q = q.eq('type', opts.filters.type);
    if (opts.search && opts.search.trim()) {
      q = q.ilike('name', `%${opts.search.trim()}%`);
    }

    const { data, error, count } = await q;
    if (error) throw error;
    return {
      data: (data ?? []).map((r) => fromDb(r as DBInventoryItem & { supplier?: { name: string | null } | null })),
      total: count ?? 0,
    };
  },

  async get(id: string): Promise<InventoryItem | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .select(SELECT)
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? fromDb(data as DBInventoryItem & { supplier?: { name: string | null } | null }) : null;
  },

  async create(input: Omit<InventoryItem, 'id'>): Promise<InventoryItem> {
    const { clinicId } = await getServiceContext();
    const { data, error } = await supabase
      .from(TABLE)
      .insert({ ...toDb(input), clinic_id: clinicId })
      .select(SELECT)
      .single();
    if (error) throw error;

    const created = fromDb(data as DBInventoryItem & { supplier?: { name: string | null } | null });

    // Initial-stock transaction (legacy parity).
    if (input.stock && input.stock > 0) {
      await supabase.from('inventory_transactions').insert({
        clinic_id: clinicId,
        item_id: created.id,
        type: 'purchase',
        quantity: input.stock,
        reason: 'Initial Stock',
      });
    }

    cache.invalidate(CACHE_PREFIX);
    return created;
  },

  async update(input: InventoryItem): Promise<InventoryItem> {
    const { data, error } = await supabase
      .from(TABLE)
      .update(toDb(input))
      .eq('id', input.id)
      .select(SELECT)
      .single();
    if (error) throw error;
    cache.invalidate(CACHE_PREFIX);
    return fromDb(data as DBInventoryItem & { supplier?: { name: string | null } | null });
  },

  async archive(id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLE)
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    cache.invalidate(CACHE_PREFIX);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) throw error;
    cache.invalidate(CACHE_PREFIX);
  },

  async adjustStock(
    id: string,
    delta: number,
    reason: string,
  ): Promise<InventoryItem> {
    const { clinicId } = await getServiceContext();
    const current = await this.get(id);
    if (!current) throw new Error('Item not found');
    const newStock = current.stock + delta;
    if (newStock < 0) throw new Error('Insufficient stock');

    const updated = await this.update({ ...current, stock: newStock });

    await supabase.from('inventory_transactions').insert({
      clinic_id: clinicId,
      item_id: id,
      type: 'adjustment',
      quantity: delta, // signed
      reason,
    });

    cache.invalidate(CACHE_PREFIX);
    return updated;
  },
};

export type { ListOpts as InventoryListOpts, ListResult as InventoryListResult };
