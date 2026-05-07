// Invoices — pg. Hydrates non-refunded payments[] from the payments table.

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

function fromDb(row, payments = []) {
  if (!row) return null;
  const status = row.status === 'paid' || row.status === 'partial' ? row.status : 'unpaid';
  return {
    id: row.id,
    appointmentId: row.appointment_id ?? '',
    patientId: row.patient_id,
    patientName: row.patient_full_name ?? '',
    amount: num(row.amount),
    paidAmount: num(row.paid_amount),
    payments: payments.filter((p) => !p.refunded).map(paymentFromDb),
    status,
    date: row.issued_at,
  };
}

const SELECT = `i.*, p.full_name AS patient_full_name`;
const FROM_JOIN = `invoices i LEFT JOIN patients p ON p.id = i.patient_id`;

async function hydratePayments(db, invoiceIds) {
  if (!invoiceIds.length) return new Map();
  const r = await db.query(
    `SELECT * FROM payments WHERE invoice_id = ANY($1::uuid[]) ORDER BY paid_at DESC`,
    [invoiceIds],
  );
  const byInv = new Map();
  for (const p of r.rows) {
    if (!byInv.has(p.invoice_id)) byInv.set(p.invoice_id, []);
    byInv.get(p.invoice_id).push(p);
  }
  return byInv;
}

async function list(db, { page = 0, pageSize = 100, patientId, status }) {
  const where = [];
  const params = [];
  if (patientId) { params.push(patientId); where.push(`i.patient_id = $${params.length}`); }
  if (status) { params.push(status); where.push(`i.status = $${params.length}`); }
  const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';

  params.push(pageSize); const limitIdx = params.length;
  params.push(page * pageSize); const offsetIdx = params.length;

  const dataSQL = `SELECT ${SELECT} FROM ${FROM_JOIN} ${whereSQL} ORDER BY i.issued_at DESC LIMIT $${limitIdx} OFFSET $${offsetIdx}`;
  const countParams = params.slice(0, params.length - 2);
  const countSQL = `SELECT COUNT(*)::int AS count FROM invoices i ${whereSQL}`;

  const [d, c] = await Promise.all([db.query(dataSQL, params), db.query(countSQL, countParams)]);
  const ids = d.rows.map((r) => r.id);
  const byInv = await hydratePayments(db, ids);
  return {
    data: d.rows.map((r) => fromDb(r, byInv.get(r.id) || [])),
    page,
    pageSize,
    total: c.rows[0].count,
  };
}

async function get(db, id) {
  const r = await db.query(`SELECT ${SELECT} FROM ${FROM_JOIN} WHERE i.id = $1`, [id]);
  if (r.rowCount === 0) return null;
  const byInv = await hydratePayments(db, [id]);
  return fromDb(r.rows[0], byInv.get(id) || []);
}

async function create(db, input, clinicId) {
  const r = await db.query(
    `INSERT INTO invoices (clinic_id, patient_id, appointment_id, amount, paid_amount, status, issued_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [
      clinicId,
      input.patientId,
      input.appointmentId || null,
      input.amount,
      input.paidAmount ?? 0,
      input.status ?? 'unpaid',
      input.date ?? new Date().toISOString(),
    ],
  );
  return get(db, r.rows[0].id);
}

async function update(db, id, patch) {
  const sets = []; const params = [];
  const set = (col, val) => { params.push(val); sets.push(`${col} = $${params.length}`); };
  if (patch.amount !== undefined) set('amount', patch.amount);
  if (patch.paidAmount !== undefined) set('paid_amount', patch.paidAmount);
  if (patch.status !== undefined) set('status', patch.status);
  if (patch.date !== undefined) set('issued_at', patch.date);
  if (sets.length === 0) return get(db, id);
  params.push(id);
  await db.query(`UPDATE invoices SET ${sets.join(', ')} WHERE id = $${params.length}`, params);
  return get(db, id);
}

async function voidInvoice(db, id) {
  await db.query(`UPDATE invoices SET status = 'void' WHERE id = $1`, [id]);
}

module.exports = { list, get, create, update, voidInvoice };
