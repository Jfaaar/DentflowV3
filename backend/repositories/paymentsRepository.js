// Payments — pg.
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

async function list(db, { page = 0, pageSize = 100, invoiceId }) {
  const where = []; const params = [];
  if (invoiceId) { params.push(invoiceId); where.push(`invoice_id = $${params.length}`); }
  const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';
  params.push(pageSize); const limitIdx = params.length;
  params.push(page * pageSize); const offsetIdx = params.length;

  const dataSQL = `SELECT * FROM payments ${whereSQL} ORDER BY paid_at DESC LIMIT $${limitIdx} OFFSET $${offsetIdx}`;
  const countParams = params.slice(0, params.length - 2);
  const countSQL = `SELECT COUNT(*)::int AS count FROM payments ${whereSQL}`;
  const [d, c] = await Promise.all([db.query(dataSQL, params), db.query(countSQL, countParams)]);
  return { data: d.rows.map(fromDb), page, pageSize, total: c.rows[0].count };
}

async function get(db, id) {
  const r = await db.query(`SELECT * FROM payments WHERE id = $1`, [id]);
  return fromDb(r.rows[0]);
}

async function create(db, input, clinicId) {
  const r = await db.query(
    `INSERT INTO payments (clinic_id, invoice_id, amount, method, paid_at, note)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [clinicId, input.invoiceId, input.amount, input.method ?? 'cash',
     input.date ?? new Date().toISOString(), input.note ?? null],
  );
  return fromDb(r.rows[0]);
}

async function update(db, id, patch) {
  const sets = []; const params = [];
  const set = (col, val) => { params.push(val); sets.push(`${col} = $${params.length}`); };
  if (patch.amount !== undefined) set('amount', patch.amount);
  if (patch.method !== undefined) set('method', patch.method);
  if (patch.date !== undefined) set('paid_at', patch.date);
  if (patch.note !== undefined) set('note', patch.note ?? null);
  if (sets.length === 0) return get(db, id);
  params.push(id);
  const r = await db.query(
    `UPDATE payments SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
    params,
  );
  return fromDb(r.rows[0]);
}

async function refund(db, id) {
  await db.query(
    `UPDATE payments SET refunded = TRUE, refunded_at = NOW() WHERE id = $1`,
    [id],
  );
}

module.exports = { list, get, create, update, refund };
