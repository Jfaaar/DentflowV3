const repo = require('../repositories/insuranceRepository');
const { ApiError } = require('../middleware/errorHandler');

function requireClinic(req) {
  if (!req.user?.clinicId) {
    throw new ApiError(400, 'MISSING_CLINIC', 'User has no associated clinic');
  }
  return req.user.clinicId;
}

// Providers
function listProviders(req) {
  return repo.listProviders(req.supabase);
}

// Policies
function listPolicies(req, query) {
  return repo.listPolicies(req.supabase, query);
}
async function getPolicy(req, id) {
  const p = await repo.getPolicy(req.supabase, id);
  if (!p) throw new ApiError(404, 'NOT_FOUND', 'Policy not found');
  return p;
}
function createPolicy(req, input) {
  return repo.createPolicy(req.supabase, input, requireClinic(req));
}
async function updatePolicy(req, id, patch) {
  const existing = await repo.getPolicy(req.supabase, id);
  if (!existing) throw new ApiError(404, 'NOT_FOUND', 'Policy not found');
  return repo.updatePolicy(req.supabase, id, patch);
}
async function deletePolicy(req, id) {
  await repo.deletePolicy(req.supabase, id);
}

// Claims
function listClaims(req, query) {
  return repo.listClaims(req.supabase, query);
}
async function getClaim(req, id) {
  const c = await repo.getClaim(req.supabase, id);
  if (!c) throw new ApiError(404, 'NOT_FOUND', 'Claim not found');
  return c;
}
function createClaim(req, input) {
  return repo.createClaim(req.supabase, input, requireClinic(req));
}
async function updateClaim(req, id, patch) {
  const existing = await repo.getClaim(req.supabase, id);
  if (!existing) throw new ApiError(404, 'NOT_FOUND', 'Claim not found');
  return repo.updateClaim(req.supabase, id, patch);
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
