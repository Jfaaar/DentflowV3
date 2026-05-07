// Dental chart entries — pg.
function fromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    clinicId: row.clinic_id,
    patientId: row.patient_id,
    tooth: row.tooth,
    surface: row.surface ?? undefined,
    finding: row.finding,
    notes: row.notes ?? undefined,
    recordedAt: row.recorded_at,
    recordedBy: row.recorded_by ?? undefined,
  };
}

const COLS = {
  patientId: 'patient_id',
  tooth: 'tooth',
  surface: 'surface',
  finding: 'finding',
  notes: 'notes',
  recordedAt: 'recorded_at',
  recordedBy: 'recorded_by',
};

async function list(db, { page = 0, pageSize = 200, patientId }) {
  const where = []; const params = [];
  if (patientId) { params.push(patientId); where.push(`patient_id = $${params.length}`); }
  const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';
  params.push(pageSize); const limitIdx = params.length;
  params.push(page * pageSize); const offsetIdx = params.length;
  const dataSQL = `SELECT * FROM dental_chart_entries ${whereSQL} ORDER BY recorded_at DESC LIMIT $${limitIdx} OFFSET $${offsetIdx}`;
  const countParams = params.slice(0, params.length - 2);
  const countSQL = `SELECT COUNT(*)::int AS count FROM dental_chart_entries ${whereSQL}`;
  const [d, c] = await Promise.all([db.query(dataSQL, params), db.query(countSQL, countParams)]);
  return { data: d.rows.map(fromDb), page, pageSize, total: c.rows[0].count };
}

async function get(db, id) {
  const r = await db.query(`SELECT * FROM dental_chart_entries WHERE id = $1`, [id]);
  return fromDb(r.rows[0]);
}

async function create(db, input, clinicId) {
  const cols = ['clinic_id', 'recorded_at'];
  const vals = [clinicId, input.recordedAt ?? new Date().toISOString()];
  for (const [k, col] of Object.entries(COLS)) {
    if (k === 'recordedAt') continue;
    if (input[k] !== undefined) {
      cols.push(col);
      vals.push(input[k] ?? null);
    }
  }
  const placeholders = vals.map((_, i) => `$${i + 1}`).join(', ');
  const r = await db.query(
    `INSERT INTO dental_chart_entries (${cols.join(', ')}) VALUES (${placeholders}) RETURNING *`,
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
    `UPDATE dental_chart_entries SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
    params,
  );
  return fromDb(r.rows[0]);
}

async function remove(db, id) {
  await db.query(`DELETE FROM dental_chart_entries WHERE id = $1`, [id]);
}

module.exports = { list, get, create, update, remove };
