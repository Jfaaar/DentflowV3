const POLICIES = 'insurance_policies';
const CLAIMS = 'insurance_claims';
const PROVIDERS = 'insurance_providers';

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

// Providers
async function listProviders(supabase) {
  const { data, error } = await supabase
    .from(PROVIDERS)
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// Policies
async function listPolicies(supabase, { page = 0, pageSize = 50, patientId }) {
  const from = page * pageSize;
  const to = from + pageSize - 1;
  let q = supabase
    .from(POLICIES)
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);
  if (patientId) q = q.eq('patient_id', patientId);
  const { data, error, count } = await q;
  if (error) throw error;
  return { data: (data ?? []).map(policyFromDb), page, pageSize, total: count ?? 0 };
}

async function getPolicy(supabase, id) {
  const { data, error } = await supabase.from(POLICIES).select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return policyFromDb(data);
}

async function createPolicy(supabase, input, clinicId) {
  const row = {
    clinic_id: clinicId,
    patient_id: input.patientId,
    provider_id: input.providerId ?? null,
    policy_number: input.policyNumber ?? null,
    coverage_pct: input.coveragePct ?? null,
    valid_until: input.validUntil ?? null,
  };
  const { data, error } = await supabase.from(POLICIES).insert(row).select('*').single();
  if (error) throw error;
  return policyFromDb(data);
}

async function updatePolicy(supabase, id, patch) {
  const row = {};
  if (patch.providerId !== undefined) row.provider_id = patch.providerId ?? null;
  if (patch.policyNumber !== undefined) row.policy_number = patch.policyNumber ?? null;
  if (patch.coveragePct !== undefined) row.coverage_pct = patch.coveragePct ?? null;
  if (patch.validUntil !== undefined) row.valid_until = patch.validUntil ?? null;
  const { data, error } = await supabase.from(POLICIES).update(row).eq('id', id).select('*').single();
  if (error) throw error;
  return policyFromDb(data);
}

async function deletePolicy(supabase, id) {
  const { error } = await supabase.from(POLICIES).delete().eq('id', id);
  if (error) throw error;
}

// Claims
async function listClaims(supabase, { page = 0, pageSize = 50, patientId, status }) {
  const from = page * pageSize;
  const to = from + pageSize - 1;
  let q = supabase
    .from(CLAIMS)
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);
  if (patientId) q = q.eq('patient_id', patientId);
  if (status) q = q.eq('status', status);
  const { data, error, count } = await q;
  if (error) throw error;
  return { data: (data ?? []).map(claimFromDb), page, pageSize, total: count ?? 0 };
}

async function getClaim(supabase, id) {
  const { data, error } = await supabase.from(CLAIMS).select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return claimFromDb(data);
}

async function createClaim(supabase, input, clinicId) {
  const row = {
    clinic_id: clinicId,
    patient_id: input.patientId,
    invoice_id: input.invoiceId ?? null,
    policy_id: input.policyId ?? null,
    status: input.status,
    submitted_at: input.submittedAt ?? null,
    amount_claimed: input.amountClaimed ?? null,
    amount_reimbursed: input.amountReimbursed ?? null,
    notes: input.notes ?? null,
  };
  const { data, error } = await supabase.from(CLAIMS).insert(row).select('*').single();
  if (error) throw error;
  return claimFromDb(data);
}

async function updateClaim(supabase, id, patch) {
  const row = {};
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.submittedAt !== undefined) row.submitted_at = patch.submittedAt ?? null;
  if (patch.amountClaimed !== undefined) row.amount_claimed = patch.amountClaimed ?? null;
  if (patch.amountReimbursed !== undefined) row.amount_reimbursed = patch.amountReimbursed ?? null;
  if (patch.notes !== undefined) row.notes = patch.notes ?? null;
  if (patch.invoiceId !== undefined) row.invoice_id = patch.invoiceId ?? null;
  if (patch.policyId !== undefined) row.policy_id = patch.policyId ?? null;
  const { data, error } = await supabase.from(CLAIMS).update(row).eq('id', id).select('*').single();
  if (error) throw error;
  return claimFromDb(data);
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
