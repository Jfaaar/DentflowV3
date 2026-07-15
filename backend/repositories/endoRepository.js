// Endodontic records — pg. One row per tooth per treatment session.
// `canals` is JSONB (variable arity per tooth) — array of
//   { name?, length_mm?, file_size?, obturation? } objects.

function fromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    clinicId: row.clinic_id,
    patientId: row.patient_id,
    tooth: row.tooth,
    treatmentDate: row.treatment_date,
    treatedBy: row.treated_by ?? undefined,
    diagnosis: row.diagnosis ?? undefined,
    canals: row.canals ?? [],
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const COLS = {
  patientId: 'patient_id',
  tooth: 'tooth',
  treatmentDate: 'treatment_date',
  treatedBy: 'treated_by',
  diagnosis: 'diagnosis',
  canals: 'canals',
  notes: 'notes',
};

async function list(db, { page = 0, pageSize = 50, patientId }) {
  const where = []; const params = [];
  if (patientId) { params.push(patientId); where.push(`patient_id = $${params.length}`); }
  const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';
  params.push(pageSize); const limitIdx = params.length;
  params.push(page * pageSize); const offsetIdx = params.length;
  const dataSQL = `SELECT * FROM endo_records ${whereSQL}
                   ORDER BY treatment_date DESC, created_at DESC
                   LIMIT $${limitIdx} OFFSET $${offsetIdx}`;
  const countParams = params.slice(0, params.length - 2);
  const countSQL = `SELECT COUNT(*)::int AS count FROM endo_records ${whereSQL}`;
  const [d, c] = await Promise.all([db.query(dataSQL, params), db.query(countSQL, countParams)]);
  return { data: d.rows.map(fromDb), page, pageSize, total: c.rows[0].count };
}

async function get(db, id) {
  const r = await db.query(`SELECT * FROM endo_records WHERE id = $1`, [id]);
  return fromDb(r.rows[0]);
}

async function create(db, input, clinicId) {
  const cols = ['clinic_id'];
  const vals = [clinicId];
  for (const [k, col] of Object.entries(COLS)) {
    if (input[k] !== undefined) {
      cols.push(col);
      vals.push(k === 'canals' ? JSON.stringify(input[k] ?? []) : (input[k] ?? null));
    }
  }
  const placeholders = vals.map((_, i) => `$${i + 1}`).join(', ');
  const r = await db.query(
    `INSERT INTO endo_records (${cols.join(', ')}) VALUES (${placeholders}) RETURNING *`,
    vals,
  );
  return fromDb(r.rows[0]);
}

async function update(db, id, patch) {
  const sets = []; const params = [];
  for (const [k, col] of Object.entries(COLS)) {
    if (patch[k] !== undefined) {
      params.push(k === 'canals' ? JSON.stringify(patch[k] ?? []) : (patch[k] ?? null));
      sets.push(`${col} = $${params.length}`);
    }
  }
  if (sets.length === 0) return get(db, id);
  params.push(id);
  const r = await db.query(
    `UPDATE endo_records SET ${sets.join(', ')}, updated_at = NOW()
      WHERE id = $${params.length} RETURNING *`,
    params,
  );
  return fromDb(r.rows[0]);
}

async function remove(db, id) {
  await db.query(`DELETE FROM endo_records WHERE id = $1`, [id]);
}

module.exports = { list, get, create, update, remove };
