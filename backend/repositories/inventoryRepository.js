// Inventory items — pg.
const num = (v) => (v == null ? 0 : typeof v === 'number' ? v : Number(v) || 0);
const numOrUndef = (v) => (v == null ? undefined : typeof v === 'number' ? v : Number(v));

const SELECT = `i.*, s.name AS supplier_name`;
const FROM_JOIN = `inventory_items i LEFT JOIN suppliers s ON s.id = i.supplier_id`;

function fromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    category: row.category ?? undefined,
    stock: num(row.stock),
    minStock: num(row.min_stock),
    supplier: row.supplier_name ?? undefined,
    price: numOrUndef(row.cost_price),
    form: row.unit ?? undefined,
    expiryDate: row.expiry_date ?? undefined,
    brand: row.brand ?? undefined,
    serialNumber: row.serial_number ?? undefined,
    lastMaintenance: row.last_maintenance ?? undefined,
    location: row.location ?? undefined,
  };
}

const COLS = {
  name: 'name',
  type: 'type',
  category: 'category',
  stock: 'stock',
  minStock: 'min_stock',
  price: 'cost_price',
  form: 'unit',
  expiryDate: 'expiry_date',
  brand: 'brand',
  serialNumber: 'serial_number',
  lastMaintenance: 'last_maintenance',
  location: 'location',
};

async function list(db, { page = 0, pageSize = 200, search, type }) {
  const where = ['i.archived_at IS NULL'];
  const params = [];
  if (type) { params.push(type); where.push(`i.type = $${params.length}`); }
  if (search?.trim()) { params.push(`%${search.trim()}%`); where.push(`i.name ILIKE $${params.length}`); }
  const whereSQL = `WHERE ${where.join(' AND ')}`;
  params.push(pageSize); const limitIdx = params.length;
  params.push(page * pageSize); const offsetIdx = params.length;

  const dataSQL = `SELECT ${SELECT} FROM ${FROM_JOIN} ${whereSQL} ORDER BY i.name ASC LIMIT $${limitIdx} OFFSET $${offsetIdx}`;
  const countParams = params.slice(0, params.length - 2);
  const countSQL = `SELECT COUNT(*)::int AS count FROM inventory_items i ${whereSQL}`;

  const [d, c] = await Promise.all([db.query(dataSQL, params), db.query(countSQL, countParams)]);
  return { data: d.rows.map(fromDb), page, pageSize, total: c.rows[0].count };
}

async function get(db, id) {
  const r = await db.query(`SELECT ${SELECT} FROM ${FROM_JOIN} WHERE i.id = $1`, [id]);
  return fromDb(r.rows[0]);
}

async function create(db, input, clinicId) {
  const cols = ['clinic_id'];
  const vals = [clinicId];
  for (const [k, col] of Object.entries(COLS)) {
    if (input[k] !== undefined) {
      cols.push(col);
      vals.push(input[k] ?? null);
    }
  }
  const placeholders = vals.map((_, i) => `$${i + 1}`).join(', ');
  const r = await db.query(
    `INSERT INTO inventory_items (${cols.join(', ')}) VALUES (${placeholders}) RETURNING id`,
    vals,
  );
  const id = r.rows[0].id;

  if (input.stock && input.stock > 0) {
    await db.query(
      `INSERT INTO inventory_transactions (clinic_id, item_id, type, quantity, reason)
       VALUES ($1, $2, 'purchase', $3, 'Initial Stock')`,
      [clinicId, id, input.stock],
    );
  }
  return get(db, id);
}

async function update(db, id, patch) {
  const sets = []; const params = [];
  for (const [k, col] of Object.entries(COLS)) {
    if (patch[k] !== undefined) {
      params.push(patch[k] ?? null);
      sets.push(`${col} = $${params.length}`);
    }
  }
  if (sets.length === 0) return get(db, id);
  params.push(id);
  await db.query(
    `UPDATE inventory_items SET ${sets.join(', ')} WHERE id = $${params.length}`,
    params,
  );
  return get(db, id);
}

async function archive(db, id) {
  await db.query(`UPDATE inventory_items SET archived_at = NOW() WHERE id = $1`, [id]);
}

async function remove(db, id) {
  await db.query(`DELETE FROM inventory_items WHERE id = $1`, [id]);
}

async function adjustStock(db, id, delta, reason, clinicId) {
  const current = await get(db, id);
  if (!current) return null;
  const newStock = current.stock + delta;
  if (newStock < 0) {
    const err = new Error('Insufficient stock');
    err.status = 400;
    err.code = 'INSUFFICIENT_STOCK';
    throw err;
  }
  const updated = await update(db, id, { stock: newStock });
  await db.query(
    `INSERT INTO inventory_transactions (clinic_id, item_id, type, quantity, reason)
     VALUES ($1, $2, 'adjustment', $3, $4)`,
    [clinicId, id, delta, reason],
  );
  return updated;
}

module.exports = { list, get, create, update, archive, remove, adjustStock };
