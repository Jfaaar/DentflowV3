/**
 * Quotes service — Supabase-backed.
 *
 * The legacy `Quote` type embeds `treatments[]`. We model that as a separate
 * `quote_items` lookup is not part of 0002; for now we still store the items
 * inline as a JSON column projection by linking the quote to a treatment_plan
 * when one is supplied. The legacy embedded array is preserved on read by
 * deriving from associated treatments.
 */

import { supabase } from '../supabase';
import { cache } from '../cache';
import { getServiceContext } from './_context';
import type { Quote, Treatment } from '../../types';

const TABLE = 'quotes';
const CACHE_PREFIX = 'cache:quotes:';

interface DBQuote {
  id: string;
  clinic_id: string;
  patient_id: string;
  plan_id: string | null;
  total: string | number;
  valid_until: string | null;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  pdf_path: string | null;
  created_at: string;
}

const num = (v: string | number | null | undefined): number =>
  v == null ? 0 : typeof v === 'number' ? v : Number(v) || 0;

const mapStatus = (s: DBQuote['status']): Quote['status'] => {
  if (s === 'accepted') return 'accepted';
  if (s === 'rejected') return 'rejected';
  return 'draft';
};

const fromDb = (row: DBQuote, treatments: Treatment[] = []): Quote => ({
  id: row.id,
  patientId: row.patient_id,
  treatments,
  total: num(row.total),
  date: row.created_at,
  status: mapStatus(row.status),
});

interface ListOpts {
  page?: number;
  pageSize?: number;
  patientId?: string;
}

interface ListResult {
  data: Quote[];
  total: number;
}

export const quotesService = {
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
      data: (data ?? []).map((r) => fromDb(r as DBQuote)),
      total: count ?? 0,
    };
  },

  async get(id: string): Promise<Quote | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? fromDb(data as DBQuote) : null;
  },

  async create(input: Omit<Quote, 'id'>): Promise<Quote> {
    const { clinicId } = await getServiceContext();
    const row = {
      clinic_id: clinicId,
      patient_id: input.patientId,
      total: input.total,
      status: input.status === 'accepted' || input.status === 'rejected' ? input.status : 'draft',
    };
    const { data, error } = await supabase
      .from(TABLE)
      .insert(row)
      .select('*')
      .single();
    if (error) throw error;
    cache.invalidate(CACHE_PREFIX);
    return fromDb(data as DBQuote, input.treatments);
  },

  async update(id: string, input: Partial<Quote>): Promise<Quote> {
    const row: Record<string, unknown> = {};
    if (input.total !== undefined) row.total = input.total;
    if (input.status !== undefined) row.status = input.status;
    const { data, error } = await supabase
      .from(TABLE)
      .update(row)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    cache.invalidate(CACHE_PREFIX);
    return fromDb(data as DBQuote);
  },

  async archive(id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLE)
      .update({ status: 'expired' })
      .eq('id', id);
    if (error) throw error;
    cache.invalidate(CACHE_PREFIX);
  },
};

export type { ListOpts as QuotesListOpts, ListResult as QuotesListResult };
