const TABLE = 'payments';

const num = (v) => (v == null ? 0 : typeof v === 'number' ? v : Number(v) || 0);

function fromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    amount: num(row.amount),
    date: row.paid_at,
    method:
      row.method === 'cash' || row.method === 'card' || row.method === 'transfer' || row.method === 'check'
        ? row.method
        : undefined,
    note: row.note ?? undefined,
    invoiceId: row.invoice_id,
    refunded: row.refunded,
  };
}

async function list(supabase, { page = 0, pageSize = 100, invoiceId }) {
  const from = page * pageSize;
  const to = from + pageSize - 1;
  let q = supabase
    .from(TABLE)
    .select('*', { count: 'exact' })
    .order('paid_at', { ascending: false })
    .range(from, to);
  if (invoiceId) q = q.eq('invoice_id', invoiceId);
  const { data, error, count } = await q;
  if (error) throw error;
  return { data: (data ?? []).map(fromDb), page, pageSize, total: count ?? 0 };
}

async function get(supabase, id) {
  const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return fromDb(data);
}

async function create(supabase, input, clinicId) {
  const row = {
    clinic_id: clinicId,
    invoice_id: input.invoiceId,
    amount: input.amount,
    method: input.method ?? 'cash',
    paid_at: input.date ?? new Date().toISOString(),
    note: input.note ?? null,
  };
  const { data, error } = await supabase.from(TABLE).insert(row).select('*').single();
  if (error) throw error;
  return fromDb(data);
}

async function update(supabase, id, patch) {
  const row = {};
  if (patch.amount !== undefined) row.amount = patch.amount;
  if (patch.method !== undefined) row.method = patch.method;
  if (patch.date !== undefined) row.paid_at = patch.date;
  if (patch.note !== undefined) row.note = patch.note ?? null;
  const { data, error } = await supabase.from(TABLE).update(row).eq('id', id).select('*').single();
  if (error) throw error;
  return fromDb(data);
}

async function refund(supabase, id) {
  const { error } = await supabase
    .from(TABLE)
    .update({ refunded: true, refunded_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

module.exports = { list, get, create, update, refund };
