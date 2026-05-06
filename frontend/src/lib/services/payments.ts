/**
 * Payments service — Supabase-backed.
 *
 * Inserts/updates here cause the DB trigger (see 0005_invoice_status_trigger.sql)
 * to recompute the parent invoice's `paid_amount` and `status`. Clients should
 * re-fetch the invoice after a payment write.
 */

import { supabase } from '../supabase';
import { cache } from '../cache';
import { getServiceContext } from './_context';
import type { Payment } from '../../types';

const TABLE = 'payments';
const CACHE_PREFIX = 'cache:payments:';

interface DBPayment {
  id: string;
  clinic_id: string;
  invoice_id: string;
  amount: string | number;
  method: 'cash' | 'card' | 'transfer' | 'check' | 'insurance';
  paid_at: string;
  note: string | null;
  refunded: boolean;
  refunded_at: string | null;
}

const fromDb = (row: DBPayment): Payment & { invoiceId: string; refunded: boolean } => ({
  id: row.id,
  amount: typeof row.amount === 'number' ? row.amount : Number(row.amount) || 0,
  date: row.paid_at,
  method:
    row.method === 'cash' || row.method === 'card' || row.method === 'transfer' || row.method === 'check'
      ? row.method
      : undefined,
  note: row.note ?? undefined,
  invoiceId: row.invoice_id,
  refunded: row.refunded,
});

interface PaymentInput {
  invoiceId: string;
  amount: number;
  method?: Payment['method'];
  date?: string;
  note?: string;
}

interface ListOpts {
  invoiceId?: string;
  page?: number;
  pageSize?: number;
}

interface ListResult {
  data: Array<Payment & { invoiceId: string; refunded: boolean }>;
  total: number;
}

export const paymentsService = {
  async list(opts: ListOpts = {}): Promise<ListResult> {
    const page = opts.page ?? 0;
    const size = opts.pageSize ?? 100;
    const from = page * size;
    const to = from + size - 1;

    let q = supabase
      .from(TABLE)
      .select('*', { count: 'exact' })
      .order('paid_at', { ascending: false })
      .range(from, to);
    if (opts.invoiceId) q = q.eq('invoice_id', opts.invoiceId);

    const { data, error, count } = await q;
    if (error) throw error;
    return {
      data: (data ?? []).map((r) => fromDb(r as DBPayment)),
      total: count ?? 0,
    };
  },

  async get(id: string) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? fromDb(data as DBPayment) : null;
  },

  async create(input: PaymentInput) {
    const { clinicId } = await getServiceContext();
    const row = {
      clinic_id: clinicId,
      invoice_id: input.invoiceId,
      amount: input.amount,
      method: input.method ?? 'cash',
      paid_at: input.date ?? new Date().toISOString(),
      note: input.note ?? null,
    };
    const { data, error } = await supabase
      .from(TABLE)
      .insert(row)
      .select('*')
      .single();
    if (error) throw error;
    cache.invalidate(CACHE_PREFIX);
    cache.invalidate('cache:invoices:');
    return fromDb(data as DBPayment);
  },

  async update(id: string, input: Partial<PaymentInput>) {
    const row: Record<string, unknown> = {};
    if (input.amount !== undefined) row.amount = input.amount;
    if (input.method !== undefined) row.method = input.method;
    if (input.date !== undefined) row.paid_at = input.date;
    if (input.note !== undefined) row.note = input.note ?? null;
    const { data, error } = await supabase
      .from(TABLE)
      .update(row)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    cache.invalidate(CACHE_PREFIX);
    cache.invalidate('cache:invoices:');
    return fromDb(data as DBPayment);
  },

  async archive(id: string) {
    const { error } = await supabase
      .from(TABLE)
      .update({ refunded: true, refunded_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    cache.invalidate(CACHE_PREFIX);
    cache.invalidate('cache:invoices:');
  },
};

export type { ListOpts as PaymentsListOpts, ListResult as PaymentsListResult, PaymentInput };
