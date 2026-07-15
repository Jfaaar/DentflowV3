// Insurance — pg. Providers + policies + claims.
const numOrUndef = (v) => (v == null ? undefined : typeof v === 'number' ? v : Number(v));

function policyFromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    clinicId: row.clinic_id,
    patientId: row.patient_id,
    providerId: row.provider_id ?? undefined,
    policyNumber: row.policy_number ?? undefined,
    coveragePct: numOrUndef(row.coverage_pct),
    validUntil: row.valid_until ?? undefined,
  };
}

function claimFromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    clinicId: row.clinic_id,
    patientId: row.patient_id,
    invoiceId: row.invoice_id ?? undefined,
    policyId: row.policy_id ?? undefined,
    status: row.status,
    submittedAt: row.submitted_at ?? undefined,
    amountClaimed: numOrUndef(row.amount_claimed),
    amountReimbursed: numOrUndef(row.amount_reimbursed),
    notes: row.notes ?? undefined,
  };
}

const POLICY_COLS = {
  patientId: 'patient_id',
  providerId: 'provider_id',
  policyNumber: 'policy_number',
  coveragePct: 'coverage_pct',
  validUntil: 'valid_until',
};

const CLAIM_COLS = {
  patientId: 'patient_id',
  invoiceId: 'invoice_id',
  policyId: 'policy_id',
  status: 'status',
  submittedAt: 'submitted_at',
  amountClaimed: 'amount_claimed',
  amountReimbursed: 'amount_reimbursed',
  notes: 'notes',
};

// Providers
async function listProviders(db) {
  const r = await db.query(`SELECT * FROM insurance_providers ORDER BY name ASC`);
  return r.rows;
}

// Policies
async function listPolicies(db, { page = 0, pageSize = 50, patientId }) {
  const where = []; const params = [];
  if (patientId) { params.push(patientId); where.push(`patient_id = $${params.length}`); }
  const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';
  params.push(pageSize); const limitIdx = params.length;
  params.push(page * pageSize); const offsetIdx = params.length;
  const dataSQL = `SELECT * FROM insurance_policies ${whereSQL} ORDER BY created_at DESC LIMIT $${limitIdx} OFFSET $${offsetIdx}`;
  const countParams = params.slice(0, params.length - 2);
  const countSQL = `SELECT COUNT(*)::int AS count FROM insurance_policies ${whereSQL}`;
  const [d, c] = await Promise.all([db.query(dataSQL, params), db.query(countSQL, countParams)]);
  return { data: d.rows.map(policyFromDb), page, pageSize, total: c.rows[0].count };
}

async function getPolicy(db, id) {
  const r = await db.query(`SELECT * FROM insurance_policies WHERE id = $1`, [id]);
  return policyFromDb(r.rows[0]);
}

async function createPolicy(db, input, clinicId) {
  const cols = ['clinic_id'];
  const vals = [clinicId];
  for (const [k, col] of Object.entries(POLICY_COLS)) {
    if (input[k] !== undefined) {
      cols.push(col);
      vals.push(input[k] ?? null);
    }
  }
  const placeholders = vals.map((_, i) => `$${i + 1}`).join(', ');
  const r = await db.query(
    `INSERT INTO insurance_policies (${cols.join(', ')}) VALUES (${placeholders}) RETURNING *`,
    vals,
  );
  return policyFromDb(r.rows[0]);
}

async function updatePolicy(db, id, patch) {
  const sets = []; const params = [];
  for (const [k, col] of Object.entries(POLICY_COLS)) {
    if (k === 'patientId') continue; // tenant column, never overwrite
    if (patch[k] !== undefined) {
      params.push(patch[k] ?? null);
      sets.push(`${col} = $${params.length}`);
    }
  }
  if (sets.length === 0) return getPolicy(db, id);
  params.push(id);
  const r = await db.query(
    `UPDATE insurance_policies SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
    params,
  );
  return policyFromDb(r.rows[0]);
}

async function deletePolicy(db, id) {
  await db.query(`DELETE FROM insurance_policies WHERE id = $1`, [id]);
}

// Claims
async function listClaims(db, { page = 0, pageSize = 50, patientId, status }) {
  const where = []; const params = [];
  if (patientId) { params.push(patientId); where.push(`patient_id = $${params.length}`); }
  if (status) { params.push(status); where.push(`status = $${params.length}`); }
  const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';
  params.push(pageSize); const limitIdx = params.length;
  params.push(page * pageSize); const offsetIdx = params.length;
  const dataSQL = `SELECT * FROM insurance_claims ${whereSQL} ORDER BY created_at DESC LIMIT $${limitIdx} OFFSET $${offsetIdx}`;
  const countParams = params.slice(0, params.length - 2);
  const countSQL = `SELECT COUNT(*)::int AS count FROM insurance_claims ${whereSQL}`;
  const [d, c] = await Promise.all([db.query(dataSQL, params), db.query(countSQL, countParams)]);
  return { data: d.rows.map(claimFromDb), page, pageSize, total: c.rows[0].count };
}

async function getClaim(db, id) {
  const r = await db.query(`SELECT * FROM insurance_claims WHERE id = $1`, [id]);
  return claimFromDb(r.rows[0]);
}

async function createClaim(db, input, clinicId) {
  const cols = ['clinic_id'];
  const vals = [clinicId];
  for (const [k, col] of Object.entries(CLAIM_COLS)) {
    if (input[k] !== undefined) {
      cols.push(col);
      vals.push(input[k] ?? null);
    }
  }
  const placeholders = vals.map((_, i) => `$${i + 1}`).join(', ');
  const r = await db.query(
    `INSERT INTO insurance_claims (${cols.join(', ')}) VALUES (${placeholders}) RETURNING *`,
    vals,
  );
  return claimFromDb(r.rows[0]);
}

async function updateClaim(db, id, patch) {
  const sets = []; const params = [];
  for (const [k, col] of Object.entries(CLAIM_COLS)) {
    if (k === 'patientId') continue;
    if (patch[k] !== undefined) {
      params.push(patch[k] ?? null);
      sets.push(`${col} = $${params.length}`);
    }
  }
  if (sets.length === 0) return getClaim(db, id);
  params.push(id);
  const r = await db.query(
    `UPDATE insurance_claims SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
    params,
  );
  return claimFromDb(r.rows[0]);
}

module.exports = {
  listProviders,
  listPolicies,
  getPolicy,
  createPolicy,
  updatePolicy,
  deletePolicy,
  listClaims,
  getClaim,
  createClaim,
  updateClaim,
};
