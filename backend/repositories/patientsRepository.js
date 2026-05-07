// Patients data access — plain Postgres via the pg pool.
//
// Convention:
//   • First argument is `db` (a pg Pool or a pooled client from
//     pool.connect()). The auth middleware attaches the pool as req.db.
//   • snake_case columns at the DB boundary, camelCase DTOs above it.
//     Mapping is hand-rolled per repository so unfamiliar columns are
//     an explicit choice, not silent passthrough.
//
// This is the template for the rest of the 15 repositories that are
// still on the legacy supabase-js client. The pattern is:
//   1. Build a parameterized SQL string with $1, $2, … placeholders.
//   2. Use db.query(text, values) — never string interpolation.
//   3. Map rows → DTO via a per-table fromDb().

const TABLE = 'patients';

function fromDb(row, mh) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.full_name,
    phone: row.phone ?? '',
    email: row.email ?? undefined,
    profilePicture: row.profile_picture ?? undefined,
    address: row.address ?? undefined,
    birthDate: row.birth_date ?? undefined,
    gender:
      row.gender === 'male' || row.gender === 'female' ? row.gender : undefined,
    insuranceProvider: row.insurance_provider ?? undefined,
    status: row.status === 'active' || row.status === 'archived' ? row.status : 'active',
    createdAt: row.created_at,
    medicalHistory: mh
      ? {
          allergies: mh.allergies ?? [],
          conditions: mh.conditions ?? [],
          medications: mh.medications ?? [],
          notes: mh.notes ?? undefined,
        }
      : undefined,
  };
}

async function list(db, { page = 0, pageSize = 50, search, status }) {
  const where = [];
  const params = [];
  if (status) {
    params.push(status);
    where.push(`status = $${params.length}`);
  }
  if (search && search.trim()) {
    params.push(`%${search.trim()}%`);
    const idx = params.length;
    where.push(`(full_name ILIKE $${idx} OR phone ILIKE $${idx} OR email ILIKE $${idx})`);
  }
  const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';

  params.push(pageSize);
  const limitIdx = params.length;
  params.push(page * pageSize);
  const offsetIdx = params.length;

  const dataSQL = `
    SELECT *
    FROM ${TABLE}
    ${whereSQL}
    ORDER BY created_at DESC
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `;
  // Re-use the same WHERE params (without LIMIT/OFFSET) for the count query.
  const countParams = params.slice(0, params.length - 2);
  const countSQL = `SELECT COUNT(*)::int AS count FROM ${TABLE} ${whereSQL}`;

  const [dataRes, countRes] = await Promise.all([
    db.query(dataSQL, params),
    db.query(countSQL, countParams),
  ]);

  return {
    data: dataRes.rows.map((r) => fromDb(r)),
    page,
    pageSize,
    total: countRes.rows[0].count,
  };
}

async function get(db, id) {
  const row = await db.query(`SELECT * FROM ${TABLE} WHERE id = $1`, [id]);
  if (row.rowCount === 0) return null;

  const mh = await db.query(
    `SELECT * FROM patient_medical_history WHERE patient_id = $1 LIMIT 1`,
    [id],
  );
  return fromDb(row.rows[0], mh.rows[0]);
}

async function create(db, input, clinicId) {
  const status = input.status ?? 'active';
  const archivedAt = status === 'archived' ? new Date().toISOString() : null;

  const cols = [
    'clinic_id', 'full_name', 'phone', 'email', 'profile_picture',
    'address', 'birth_date', 'gender', 'insurance_provider', 'status',
    'archived_at',
  ];
  const vals = [
    clinicId,
    input.name,
    input.phone || null,
    input.email || null,
    input.profilePicture || null,
    input.address || null,
    input.birthDate || null,
    input.gender || null,
    input.insuranceProvider || null,
    status,
    archivedAt,
  ];
  const placeholders = vals.map((_, i) => `$${i + 1}`).join(', ');
  const res = await db.query(
    `INSERT INTO ${TABLE} (${cols.join(', ')}) VALUES (${placeholders}) RETURNING *`,
    vals,
  );
  return fromDb(res.rows[0]);
}

async function update(db, id, patch) {
  const sets = [];
  const params = [];
  const push = (col, val) => {
    params.push(val);
    sets.push(`${col} = $${params.length}`);
  };

  if (patch.name !== undefined) push('full_name', patch.name);
  if (patch.phone !== undefined) push('phone', patch.phone || null);
  if (patch.email !== undefined) push('email', patch.email || null);
  if (patch.profilePicture !== undefined) push('profile_picture', patch.profilePicture || null);
  if (patch.address !== undefined) push('address', patch.address || null);
  if (patch.birthDate !== undefined) push('birth_date', patch.birthDate || null);
  if (patch.gender !== undefined) push('gender', patch.gender || null);
  if (patch.insuranceProvider !== undefined) push('insurance_provider', patch.insuranceProvider || null);
  if (patch.status !== undefined) {
    push('status', patch.status);
    push('archived_at', patch.status === 'archived' ? new Date().toISOString() : null);
  }

  if (sets.length === 0) {
    // No updatable fields — just return the current row.
    return get(db, id);
  }

  params.push(id);
  const res = await db.query(
    `UPDATE ${TABLE} SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
    params,
  );
  return fromDb(res.rows[0]);
}

async function archive(db, id) {
  await db.query(
    `UPDATE ${TABLE} SET status = 'archived', archived_at = NOW() WHERE id = $1`,
    [id],
  );
}

async function remove(db, id) {
  await db.query(`DELETE FROM ${TABLE} WHERE id = $1`, [id]);
}

module.exports = { list, get, create, update, archive, remove };
