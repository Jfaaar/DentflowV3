/**
 * Invoices service — Supabase-backed.
 *
 * Note: the legacy `Invoice` type embeds `payments[]`. We hydrate that from the
 * `payments` table on read and keep writes against the canonical tables.
 */

import { supabase } from '../supabase';
import { cache } from '../cache';
import { getServiceContext } from './_context';
import type { Invoice, Payment } from '../../types';

const TABLE = 'invoices';
const CACHE_PREFIX = 'cache:invoices:';

interface DBInvoice {
  id: string;
  clinic_id: string;
  patient_id: string;
  appointment_id: string | null;
  amount: string | number;
  paid_amount: string | number;
  status: 'draft' | 'unpaid' | 'partial' | 'paid' | 'overdue' | 'void';
  issued_at: string;
  due_at: string | null;
  created_at: string;
}

interface DBInvoiceWithJoins extends DBInvoice {
  patient?: { full_name: string | null } | null;
  payments?: DBPayment[] | null;
}

interface DBPayment {
  id: string;
  invoice_id: string;
  amount: string | number;
  method: 'cash' | 'card' | 'transfer' | 'check' | 'insurance';
  paid_at: string;
  note: string | null;
  refunded: boolean;
}

const num = (v: string | number | null | undefined): number =>
  v == null ? 0 : typeof v === 'number' ? v : Number(v) || 0;

const paymentFromDb = (p: DBPayment): Payment => ({
  id: p.id,
  amount: num(p.amount),
  date: p.paid_at,
  method:
    p.method === 'cash' || p.method === 'card' || p.method === 'transfer' || p.method === 'check'
      ? p.method
      : undefined,
  note: p.note ?? undefined,
});

const fromDb = (row: DBInvoiceWithJoins): Invoice => {
  const payments = (row.payments ?? []).filter((p) => !p.refunded).map(paymentFromDb);
  const status: Invoice['status'] =
    row.status === 'paid' || row.status === 'partial' ? row.status : 'unpaid';
  return {
    id: row.id,
    appointmentId: row.appointment_id ?? '',
    patientId: row.patient_id,
    patientName: row.patient?.full_name ?? '',
    amount: num(row.amount),
    paidAmount: num(row.paid_amount),
    payments,
    status,
    date: row.issued_at,
  };
};

const SELECT = '*, patient:patients(full_name), payments(*)';

interface ListOpts {
  page?: number;
  pageSize?: number;
  patientId?: string;
  filters?: { status?: Invoice['status'] };
}

interface ListResult {
  data: Invoice[];
  total: number;
}

export const invoicesService = {
  async list(opts: ListOpts = {}): Promise<ListResult> {
    const page = opts.page ?? 0;
    const size = opts.pageSize ?? 100;
    const from = page * size;
    const to = from + size - 1;

    let q = supabase
      .from(TABLE)
      .select(SELECT, { count: 'exact' })
      .order('issued_at', { ascending: false })
      .range(from, to);

    if (opts.patientId) q = q.eq('patient_id', opts.patientId);
    if (opts.filters?.status) q = q.eq('status', opts.filters.status);

    const { data, error, count } = await q;
    if (error) throw error;
    const rows = (data ?? []).map((r) => fromDb(r as DBInvoiceWithJoins));
    return { data: rows, total: count ?? 0 };
  },

  async get(id: string): Promise<Invoice | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .select(SELECT)
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? fromDb(data as DBInvoiceWithJoins) : null;
  },

  async create(input: Omit<Invoice, 'id'>): Promise<Invoice> {
    const { clinicId } = await getServiceContext();
    const row = {
      clinic_id: clinicId,
      patient_id: input.patientId,
      appointment_id: input.appointmentId || null,
      amount: input.amount,
      paid_amount: input.paidAmount ?? 0,
      status: input.status ?? 'unpaid',
      issued_at: input.date ?? new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from(TABLE)
      .insert(row)
      .select(SELECT)
      .single();
    if (error) throw error;
    cache.invalidate(CACHE_PREFIX);
    return fromDb(data as DBInvoiceWithJoins);
  },

  async update(input: Invoice): Promise<Invoice> {
    const row: Record<string, unknown> = {
      amount: input.amount,
      paid_amount: input.paidAmount,
      status: input.status,
      issued_at: input.date,
    };
    const { data, error } = await supabase
      .from(TABLE)
      .update(row)
      .eq('id', input.id)
      .select(SELECT)
      .single();
    if (error) throw error;
    cache.invalidate(CACHE_PREFIX);
    return fromDb(data as DBInvoiceWithJoins);
  },

  async archive(id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLE)
      .update({ status: 'void' })
      .eq('id', id);
    if (error) throw error;
    cache.invalidate(CACHE_PREFIX);
  },
};

export type { ListOpts as InvoicesListOpts, ListResult as InvoicesListResult };
