// Vital signs — pg. BMI is a GENERATED column; never written from app code.
function fromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    clinicId: row.clinic_id,
    patientId: row.patient_id,
    recordedBy: row.recorded_by ?? undefined,
    recordedAt: row.recorded_at,
    systolicBp: row.systolic_bp ?? undefined,
    diastolicBp: row.diastolic_bp ?? undefined,
    heartRate: row.heart_rate ?? undefined,
    temperatureC: row.temperature_c != null ? Number(row.temperature_c) : undefined,
    respiratoryRate: row.respiratory_rate ?? undefined,
    spo2: row.spo2 ?? undefined,
    weightKg: row.weight_kg != null ? Number(row.weight_kg) : undefined,
    heightCm: row.height_cm != null ? Number(row.height_cm) : undefined,
    bmi: row.bmi != null ? Number(row.bmi) : undefined,
    painScore: row.pain_score ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const COLS = {
  patientId: 'patient_id',
  recordedBy: 'recorded_by',
  recordedAt: 'recorded_at',
  systolicBp: 'systolic_bp',
  diastolicBp: 'diastolic_bp',
  heartRate: 'heart_rate',
  temperatureC: 'temperature_c',
  respiratoryRate: 'respiratory_rate',
  spo2: 'spo2',
  weightKg: 'weight_kg',
  heightCm: 'height_cm',
  painScore: 'pain_score',
  notes: 'notes',
};

async function list(db, { page = 0, pageSize = 50, patientId }) {
  const where = []; const params = [];
  if (patientId) { params.push(patientId); where.push(`patient_id = $${params.length}`); }
  const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';
  params.push(pageSize); const limitIdx = params.length;
  params.push(page * pageSize); const offsetIdx = params.length;
  const dataSQL = `SELECT * FROM vital_signs ${whereSQL} ORDER BY recorded_at DESC LIMIT $${limitIdx} OFFSET $${offsetIdx}`;
  const countParams = params.slice(0, params.length - 2);
  const countSQL = `SELECT COUNT(*)::int AS count FROM vital_signs ${whereSQL}`;
  const [d, c] = await Promise.all([db.query(dataSQL, params), db.query(countSQL, countParams)]);
  return { data: d.rows.map(fromDb), page, pageSize, total: c.rows[0].count };
}

async function get(db, id) {
  const r = await db.query(`SELECT * FROM vital_signs WHERE id = $1`, [id]);
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
    `INSERT INTO vital_signs (${cols.join(', ')}) VALUES (${placeholders}) RETURNING *`,
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
    `UPDATE vital_signs SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
    params,
  );
  return fromDb(r.rows[0]);
}

async function remove(db, id) {
  await db.query(`DELETE FROM vital_signs WHERE id = $1`, [id]);
}

module.exports = { list, get, create, update, remove };
