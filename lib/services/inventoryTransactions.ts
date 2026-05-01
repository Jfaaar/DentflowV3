/**
 * Inventory Transactions service — Supabase-backed.
 *
 * The legacy app uses a tri-state `'IN' | 'OUT' | 'ADJUST'` enum + positive
 * quantities. The DB schema uses signed quantities and a richer enum
 * (`purchase | usage | adjustment | return | expired | damaged | transfer`).
 * The mapper here keeps the legacy UI working: positive `quantity` + UI type.
 */

import { supabase } from '../supabase';
import { cache } from '../cache';
import { getServiceContext } from './_context';
import type { InventoryTransaction } from '../../types';

const TABLE = 'inventory_transactions';
const CACHE_PREFIX = 'cache:inventory_transactions:';

type DbTxnType =
  | 'purchase'
  | 'usage'
  | 'adjustment'
  | 'return'
  | 'expired'
  | 'damaged'
  | 'transfer';

interface DBInventoryTxn {
  id: string;
  clinic_id: string;
  item_id: string;
  type: DbTxnType;
  quantity: string | number;
  reason: string | null;
  reference_id: string | null;
  created_at: string;
}

interface DBTxnWithItem extends DBInventoryTxn {
  item?: { name: string | null } | null;
}

const num = (v: string | number | null | undefined): number =>
  v == null ? 0 : typeof v === 'number' ? v : Number(v) || 0;

const toLegacyType = (t: DbTxnType, qty: number): InventoryTransaction['type'] => {
  if (t === 'adjustment') return 'ADJUST';
  if (t === 'purchase' || t === 'return') return 'IN';
  return qty < 0 ? 'OUT' : t === 'usage' ? 'OUT' : 'IN';
};

const fromDb = (row: DBTxnWithItem): InventoryTransaction => {
  const qty = num(row.quantity);
  return {
    id: row.id,
    medicamentId: row.item_id,
    medicamentName: row.item?.name ?? '',
    type: toLegacyType(row.type, qty),
    quantity: Math.abs(qty),
    reason: row.reason ?? undefined,
    date: row.created_at,
  };
};

const SELECT = '*, item:inventory_items(name)';

interface ListOpts {
  page?: number;
  pageSize?: number;
  itemId?: string;
}

interface ListResult {
  data: InventoryTransaction[];
  total: number;
}

export const inventoryTransactionsService = {
  async list(opts: ListOpts = {}): Promise<ListResult> {
    const page = opts.page ?? 0;
    const size = opts.pageSize ?? 200;
    const from = page * size;
    const to = from + size - 1;

    let q = supabase
      .from(TABLE)
      .select(SELECT, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);
    if (opts.itemId) q = q.eq('item_id', opts.itemId);

    const { data, error, count } = await q;
    if (error) throw error;
    return {
      data: (data ?? []).map((r) => fromDb(r as DBTxnWithItem)),
      total: count ?? 0,
    };
  },

  async get(id: string): Promise<InventoryTransaction | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .select(SELECT)
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? fromDb(data as DBTxnWithItem) : null;
  },

  async create(input: Omit<InventoryTransaction, 'id'>): Promise<InventoryTransaction> {
    const { clinicId } = await getServiceContext();
    const dbType: DbTxnType =
      input.type === 'IN'
        ? 'purchase'
        : input.type === 'OUT'
          ? 'usage'
          : 'adjustment';
    const signedQty =
      input.type === 'OUT' ? -Math.abs(input.quantity) : Math.abs(input.quantity);
    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        clinic_id: clinicId,
        item_id: input.medicamentId,
        type: dbType,
        quantity: signedQty,
        reason: input.reason ?? null,
      })
      .select(SELECT)
      .single();
    if (error) throw error;
    cache.invalidate(CACHE_PREFIX);
    return fromDb(data as DBTxnWithItem);
  },

  async update(): Promise<never> {
    throw new Error('inventory_transactions are append-only');
  },

  async archive(id: string): Promise<void> {
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) throw error;
    cache.invalidate(CACHE_PREFIX);
  },
};

export type { ListOpts as InventoryTxnListOpts, ListResult as InventoryTxnListResult };
