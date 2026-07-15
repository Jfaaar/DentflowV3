// Quotes — pg.
const num = (v) => (v == null ? 0 : typeof v === 'number' ? v : Number(v) || 0);

function mapStatus(s) {
  if (s === 'accepted') return 'accepted';
  if (s === 'rejected') return 'rejected';
  return 'draft';
}

function fromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    patientId: row.patient_id,
    treatments: [],
    total: num(row.total),
    date: row.created_at,
    status: mapStatus(row.status),
  };
}

async function list(db, { page = 0, pageSize = 50, patientId }) {
  const where = []; const params = [];
  if (patientId) { params.push(patientId); where.push(`patient_id = $${params.length}`); }
  const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';
  params.push(pageSize); const limitIdx = params.length;
  params.push(page * pageSize); const offsetIdx = params.length;
  const dataSQL = `SELECT * FROM quotes ${whereSQL} ORDER BY created_at DESC LIMIT $${limitIdx} OFFSET $${offsetIdx}`;
  const countParams = params.slice(0, params.length - 2);
  const countSQL = `SELECT COUNT(*)::int AS count FROM quotes ${whereSQL}`;
  const [d, c] = await Promise.all([db.query(dataSQL, params), db.query(countSQL, countParams)]);
  return { data: d.rows.map(fromDb), page, pageSize, total: c.rows[0].count };
}

async function get(db, id) {
  const r = await db.query(`SELECT * FROM quotes WHERE id = $1`, [id]);
  return fromDb(r.rows[0]);
}

async function create(db, input, clinicId) {
  const status = input.status === 'accepted' || input.status === 'rejected' ? input.status : 'draft';
  const r = await db.query(
    `INSERT INTO quotes (clinic_id, patient_id, total, status) VALUES ($1, $2, $3, $4) RETURNING *`,
    [clinicId, input.patientId, input.total, status],
  );
  return fromDb(r.rows[0]);
}

async function update(db, id, patch) {
  const sets = []; const params = [];
  const set = (col, val) => { params.push(val); sets.push(`${col} = $${params.length}`); };
  if (patch.total !== undefined) set('total', patch.total);
  if (patch.status !== undefined) set('status', patch.status);
  if (sets.length === 0) return get(db, id);
  params.push(id);
  const r = await db.query(
    `UPDATE quotes SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
    params,
  );
  return fromDb(r.rows[0]);
}

async function expire(db, id) {
  await db.query(`UPDATE quotes SET status = 'expired' WHERE id = $1`, [id]);
}

module.exports = { list, get, create, update, expire };
