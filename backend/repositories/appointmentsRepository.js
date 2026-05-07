// Appointments — pg.
const SELECT = `a.id, a.patient_id, a.starts_at, a.ends_at, a.status,
  a.observation, a.created_at, p.full_name AS patient_full_name`;
const FROM_JOIN = `appointments a LEFT JOIN patients p ON p.id = a.patient_id`;

function fromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    patientId: row.patient_id,
    patientName: row.patient_full_name ?? '',
    start: row.starts_at,
    end: row.ends_at,
    status: row.status,
    observation: row.observation ?? undefined,
    createdAt: row.created_at,
  };
}

async function list(db, { page = 0, pageSize = 200, patientId, status, from, to }) {
  const where = [];
  const params = [];
  if (patientId) { params.push(patientId); where.push(`a.patient_id = $${params.length}`); }
  if (status) { params.push(status); where.push(`a.status = $${params.length}`); }
  if (from) { params.push(from); where.push(`a.starts_at >= $${params.length}`); }
  if (to) { params.push(to); where.push(`a.starts_at <= $${params.length}`); }
  const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';

  params.push(pageSize); const limitIdx = params.length;
  params.push(page * pageSize); const offsetIdx = params.length;

  const dataSQL = `SELECT ${SELECT} FROM ${FROM_JOIN} ${whereSQL} ORDER BY a.starts_at ASC LIMIT $${limitIdx} OFFSET $${offsetIdx}`;
  const countParams = params.slice(0, params.length - 2);
  const countSQL = `SELECT COUNT(*)::int AS count FROM appointments a ${whereSQL.replace(/a\./g, 'a.')}`;

  const [d, c] = await Promise.all([db.query(dataSQL, params), db.query(countSQL, countParams)]);
  return { data: d.rows.map(fromDb), page, pageSize, total: c.rows[0].count };
}

async function get(db, id) {
  const r = await db.query(`SELECT ${SELECT} FROM ${FROM_JOIN} WHERE a.id = $1`, [id]);
  return fromDb(r.rows[0]);
}

async function create(db, input, clinicId) {
  const r = await db.query(
    `INSERT INTO appointments (clinic_id, patient_id, starts_at, ends_at, status, observation)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [clinicId, input.patientId, input.start, input.end, input.status ?? 'pending', input.observation || null],
  );
  return get(db, r.rows[0].id);
}

async function update(db, id, patch) {
  const sets = []; const params = [];
  const set = (col, val) => { params.push(val); sets.push(`${col} = $${params.length}`); };
  if (patch.patientId !== undefined) set('patient_id', patch.patientId);
  if (patch.start !== undefined) set('starts_at', patch.start);
  if (patch.end !== undefined) set('ends_at', patch.end);
  if (patch.status !== undefined) set('status', patch.status);
  if (patch.observation !== undefined) set('observation', patch.observation || null);
  if (sets.length === 0) return get(db, id);
  params.push(id);
  await db.query(`UPDATE appointments SET ${sets.join(', ')} WHERE id = $${params.length}`, params);
  return get(db, id);
}

async function cancel(db, id, reason) {
  await db.query(
    `UPDATE appointments SET status = 'canceled', cancellation_reason = $1 WHERE id = $2`,
    [reason ?? null, id],
  );
}

async function cancelMany(db, ids) {
  if (!ids.length) return;
  await db.query(`UPDATE appointments SET status = 'canceled' WHERE id = ANY($1::uuid[])`, [ids]);
}

module.exports = { list, get, create, update, cancel, cancelMany };
