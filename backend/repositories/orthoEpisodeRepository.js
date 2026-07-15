// Orthodontic episodes — pg. A course of orthodontic treatment; visits hang
// off via ortho_visits.ortho_episode_id. `photo_file_ids` is uuid[].

function fromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    clinicId: row.clinic_id,
    patientId: row.patient_id,
    startDate: row.start_date,
    endDate: row.end_date ?? undefined,
    applianceType: row.appliance_type ?? undefined,
    plan: row.plan ?? undefined,
    status: row.status,
    photoFileIds: row.photo_file_ids ?? [],
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const COLS = {
  patientId: 'patient_id',
  startDate: 'start_date',
  endDate: 'end_date',
  applianceType: 'appliance_type',
  plan: 'plan',
  status: 'status',
  photoFileIds: 'photo_file_ids',
  notes: 'notes',
};

async function list(db, { page = 0, pageSize = 50, patientId, status }) {
  const where = []; const params = [];
  if (patientId) { params.push(patientId); where.push(`patient_id = $${params.length}`); }
  if (status) { params.push(status); where.push(`status = $${params.length}`); }
  const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';
  params.push(pageSize); const limitIdx = params.length;
  params.push(page * pageSize); const offsetIdx = params.length;
  const dataSQL = `SELECT * FROM ortho_episodes ${whereSQL}
                   ORDER BY start_date DESC
                   LIMIT $${limitIdx} OFFSET $${offsetIdx}`;
  const countParams = params.slice(0, params.length - 2);
  const countSQL = `SELECT COUNT(*)::int AS count FROM ortho_episodes ${whereSQL}`;
  const [d, c] = await Promise.all([db.query(dataSQL, params), db.query(countSQL, countParams)]);
  return { data: d.rows.map(fromDb), page, pageSize, total: c.rows[0].count };
}

async function get(db, id) {
  const r = await db.query(`SELECT * FROM ortho_episodes WHERE id = $1`, [id]);
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
    `INSERT INTO ortho_episodes (${cols.join(', ')}) VALUES (${placeholders}) RETURNING *`,
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
    `UPDATE ortho_episodes SET ${sets.join(', ')}, updated_at = NOW()
      WHERE id = $${params.length} RETURNING *`,
    params,
  );
  return fromDb(r.rows[0]);
}

async function remove(db, id) {
  await db.query(`DELETE FROM ortho_episodes WHERE id = $1`, [id]);
}

module.exports = { list, get, create, update, remove };
