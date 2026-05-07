// Treatment plans — pg.
const numOrUndef = (v) => (v == null ? undefined : typeof v === 'number' ? v : Number(v));

function fromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    clinicId: row.clinic_id,
    patientId: row.patient_id,
    doctorId: row.doctor_id ?? undefined,
    title: row.title ?? undefined,
    status: row.status,
    estimatedTotal: numOrUndef(row.estimated_total),
    discount: numOrUndef(row.discount),
    insuranceCovered: numOrUndef(row.insurance_covered),
    patientResponsibility: numOrUndef(row.patient_responsibility),
    acceptedAt: row.accepted_at ?? undefined,
  };
}

const COLS = {
  patientId: 'patient_id',
  doctorId: 'doctor_id',
  title: 'title',
  status: 'status',
  estimatedTotal: 'estimated_total',
  discount: 'discount',
  insuranceCovered: 'insurance_covered',
  patientResponsibility: 'patient_responsibility',
  acceptedAt: 'accepted_at',
};

async function list(db, { page = 0, pageSize = 50, patientId, status }) {
  const where = []; const params = [];
  if (patientId) { params.push(patientId); where.push(`patient_id = $${params.length}`); }
  if (status) { params.push(status); where.push(`status = $${params.length}`); }
  const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';
  params.push(pageSize); const limitIdx = params.length;
  params.push(page * pageSize); const offsetIdx = params.length;
  const dataSQL = `SELECT * FROM treatment_plans ${whereSQL} ORDER BY created_at DESC LIMIT $${limitIdx} OFFSET $${offsetIdx}`;
  const countParams = params.slice(0, params.length - 2);
  const countSQL = `SELECT COUNT(*)::int AS count FROM treatment_plans ${whereSQL}`;
  const [d, c] = await Promise.all([db.query(dataSQL, params), db.query(countSQL, countParams)]);
  return { data: d.rows.map(fromDb), page, pageSize, total: c.rows[0].count };
}

async function get(db, id) {
  const r = await db.query(`SELECT * FROM treatment_plans WHERE id = $1`, [id]);
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
    `INSERT INTO treatment_plans (${cols.join(', ')}) VALUES (${placeholders}) RETURNING *`,
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
    `UPDATE treatment_plans SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
    params,
  );
  return fromDb(r.rows[0]);
}

async function cancel(db, id) {
  await db.query(`UPDATE treatment_plans SET status = 'canceled' WHERE id = $1`, [id]);
}

module.exports = { list, get, create, update, cancel };
