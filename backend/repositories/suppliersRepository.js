// Suppliers — pg.
function fromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    contactPerson: row.contact_person ?? undefined,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    address: row.address ?? undefined,
  };
}

const COLS = {
  name: 'name',
  contactPerson: 'contact_person',
  phone: 'phone',
  email: 'email',
  address: 'address',
};

async function list(db, { page = 0, pageSize = 200, search }) {
  const where = []; const params = [];
  if (search?.trim()) { params.push(`%${search.trim()}%`); where.push(`name ILIKE $${params.length}`); }
  const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';
  params.push(pageSize); const limitIdx = params.length;
  params.push(page * pageSize); const offsetIdx = params.length;
  const dataSQL = `SELECT * FROM suppliers ${whereSQL} ORDER BY name ASC LIMIT $${limitIdx} OFFSET $${offsetIdx}`;
  const countParams = params.slice(0, params.length - 2);
  const countSQL = `SELECT COUNT(*)::int AS count FROM suppliers ${whereSQL}`;
  const [d, c] = await Promise.all([db.query(dataSQL, params), db.query(countSQL, countParams)]);
  return { data: d.rows.map(fromDb), page, pageSize, total: c.rows[0].count };
}

async function get(db, id) {
  const r = await db.query(`SELECT * FROM suppliers WHERE id = $1`, [id]);
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
    `INSERT INTO suppliers (${cols.join(', ')}) VALUES (${placeholders}) RETURNING *`,
    vals,
  );
  return fromDb(r.rows[0]);
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
  const r = await db.query(
    `UPDATE suppliers SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
    params,
  );
  return fromDb(r.rows[0]);
}

async function remove(db, id) {
  await db.query(`DELETE FROM suppliers WHERE id = $1`, [id]);
}

module.exports = { list, get, create, update, remove };
