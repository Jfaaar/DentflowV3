// Clinical notes — pg.
function fromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    clinicId: row.clinic_id,
    patientId: row.patient_id,
    doctorId: row.doctor_id,
    appointmentId: row.appointment_id ?? undefined,
    consultationReason: row.consultation_reason ?? undefined,
    symptoms: row.symptoms ?? undefined,
    diagnosis: row.diagnosis ?? undefined,
    notes: row.notes ?? undefined,
    treatmentPlan: row.treatment_plan ?? undefined,
    followUp: row.follow_up ?? undefined,
    vitals: row.vitals ?? undefined,
    signedAt: row.signed_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const COLS = {
  patientId: 'patient_id',
  doctorId: 'doctor_id',
  appointmentId: 'appointment_id',
  consultationReason: 'consultation_reason',
  symptoms: 'symptoms',
  diagnosis: 'diagnosis',
  notes: 'notes',
  treatmentPlan: 'treatment_plan',
  followUp: 'follow_up',
  vitals: 'vitals',
  signedAt: 'signed_at',
};

async function list(db, { page = 0, pageSize = 50, patientId }) {
  const where = []; const params = [];
  if (patientId) { params.push(patientId); where.push(`patient_id = $${params.length}`); }
  const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';
  params.push(pageSize); const limitIdx = params.length;
  params.push(page * pageSize); const offsetIdx = params.length;
  const dataSQL = `SELECT * FROM clinical_notes ${whereSQL} ORDER BY created_at DESC LIMIT $${limitIdx} OFFSET $${offsetIdx}`;
  const countParams = params.slice(0, params.length - 2);
  const countSQL = `SELECT COUNT(*)::int AS count FROM clinical_notes ${whereSQL}`;
  const [d, c] = await Promise.all([db.query(dataSQL, params), db.query(countSQL, countParams)]);
  return { data: d.rows.map(fromDb), page, pageSize, total: c.rows[0].count };
}

async function get(db, id) {
  const r = await db.query(`SELECT * FROM clinical_notes WHERE id = $1`, [id]);
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
    `INSERT INTO clinical_notes (${cols.join(', ')}) VALUES (${placeholders}) RETURNING *`,
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
    `UPDATE clinical_notes SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
    params,
  );
  return fromDb(r.rows[0]);
}

async function remove(db, id) {
  await db.query(`DELETE FROM clinical_notes WHERE id = $1`, [id]);
}

module.exports = { list, get, create, update, remove };
