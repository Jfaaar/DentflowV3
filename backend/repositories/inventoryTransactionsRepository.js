// Inventory transactions — pg.
const num = (v) => (v == null ? 0 : typeof v === 'number' ? v : Number(v) || 0);

function toLegacyType(t, qty) {
  if (t === 'adjustment') return 'ADJUST';
  if (t === 'purchase' || t === 'return') return 'IN';
  if (qty < 0) return 'OUT';
  return t === 'usage' ? 'OUT' : 'IN';
}

function fromDb(row) {
  if (!row) return null;
  const qty = num(row.quantity);
  return {
    id: row.id,
    medicamentId: row.item_id,
    medicamentName: row.item_name ?? '',
    type: toLegacyType(row.type, qty),
    quantity: Math.abs(qty),
    reason: row.reason ?? undefined,
    date: row.created_at,
  };
}

const SELECT = `t.*, i.name AS item_name`;
const FROM_JOIN = `inventory_transactions t LEFT JOIN inventory_items i ON i.id = t.item_id`;

async function list(db, { page = 0, pageSize = 200, itemId }) {
  const where = []; const params = [];
  if (itemId) { params.push(itemId); where.push(`t.item_id = $${params.length}`); }
  const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';
  params.push(pageSize); const limitIdx = params.length;
  params.push(page * pageSize); const offsetIdx = params.length;
  const dataSQL = `SELECT ${SELECT} FROM ${FROM_JOIN} ${whereSQL} ORDER BY t.created_at DESC LIMIT $${limitIdx} OFFSET $${offsetIdx}`;
  const countParams = params.slice(0, params.length - 2);
  const countSQL = `SELECT COUNT(*)::int AS count FROM inventory_transactions t ${whereSQL}`;
  const [d, c] = await Promise.all([db.query(dataSQL, params), db.query(countSQL, countParams)]);
  return { data: d.rows.map(fromDb), page, pageSize, total: c.rows[0].count };
}

async function get(db, id) {
  const r = await db.query(`SELECT ${SELECT} FROM ${FROM_JOIN} WHERE t.id = $1`, [id]);
  return fromDb(r.rows[0]);
}

async function create(db, input, clinicId) {
  const dbType = input.type === 'IN' ? 'purchase' : input.type === 'OUT' ? 'usage' : 'adjustment';
  const signedQty = input.type === 'OUT' ? -Math.abs(input.quantity) : Math.abs(input.quantity);
  const r = await db.query(
    `INSERT INTO inventory_transactions (clinic_id, item_id, type, quantity, reason)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [clinicId, input.medicamentId, dbType, signedQty, input.reason ?? null],
  );
  return get(db, r.rows[0].id);
}

async function remove(db, id) {
  await db.query(`DELETE FROM inventory_transactions WHERE id = $1`, [id]);
}

module.exports = { list, get, create, remove };
