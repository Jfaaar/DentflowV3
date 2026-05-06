const TABLE = 'invoices';
const SELECT = '*, patient:patients(full_name), payments(*)';

const num = (v) => (v == null ? 0 : typeof v === 'number' ? v : Number(v) || 0);

function paymentFromDb(p) {
  return {
    id: p.id,
    amount: num(p.amount),
    date: p.paid_at,
    method:
      p.method === 'cash' || p.method === 'card' || p.method === 'transfer' || p.method === 'check'
        ? p.method
        : undefined,
    note: p.note ?? undefined,
  };
}

function fromDb(row) {
  if (!row) return null;
  const payments = (row.payments ?? []).filter((p) => !p.refunded).map(paymentFromDb);
  const status = row.status === 'paid' || row.status === 'partial' ? row.status : 'unpaid';
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
}

async function list(supabase, { page = 0, pageSize = 100, patientId, status }) {
  const from = page * pageSize;
  const to = from + pageSize - 1;
  let q = supabase
    .from(TABLE)
    .select(SELECT, { count: 'exact' })
    .order('issued_at', { ascending: false })
    .range(from, to);
  if (patientId) q = q.eq('patient_id', patientId);
  if (status) q = q.eq('status', status);
  const { data, error, count } = await q;
  if (error) throw error;
  return { data: (data ?? []).map(fromDb), page, pageSize, total: count ?? 0 };
}

async function get(supabase, id) {
  const { data, error } = await supabase.from(TABLE).select(SELECT).eq('id', id).maybeSingle();
  if (error) throw error;
  return fromDb(data);
}

async function create(supabase, input, clinicId) {
  const row = {
    clinic_id: clinicId,
    patient_id: input.patientId,
    appointment_id: input.appointmentId || null,
    amount: input.amount,
    paid_amount: input.paidAmount ?? 0,
    status: input.status ?? 'unpaid',
    issued_at: input.date ?? new Date().toISOString(),
  };
  const { data, error } = await supabase.from(TABLE).insert(row).select(SELECT).single();
  if (error) throw error;
  return fromDb(data);
}

async function update(supabase, id, patch) {
  const row = {};
  if (patch.amount !== undefined) row.amount = patch.amount;
  if (patch.paidAmount !== undefined) row.paid_amount = patch.paidAmount;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.date !== undefined) row.issued_at = patch.date;
  const { data, error } = await supabase.from(TABLE).update(row).eq('id', id).select(SELECT).single();
  if (error) throw error;
  return fromDb(data);
}

async function voidInvoice(supabase, id) {
  const { error } = await supabase.from(TABLE).update({ status: 'void' }).eq('id', id);
  if (error) throw error;
}

module.exports = { list, get, create, update, voidInvoice };
