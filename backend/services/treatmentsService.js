const repo = require('../repositories/treatmentsRepository');
const { ApiError } = require('../middleware/errorHandler');

function listTreatments(req, query) {
  return repo.list(req.supabase, query);
}

async function getTreatment(req, id) {
  const t = await repo.get(req.supabase, id);
  if (!t) throw new ApiError(404, 'NOT_FOUND', 'Treatment not found');
  return t;
}

function createTreatment(req, input) {
  if (!req.user?.clinicId) {
    throw new ApiError(400, 'MISSING_CLINIC', 'User has no associated clinic');
  }
  return repo.create(req.supabase, input, req.user.clinicId);
}

async function updateTreatment(req, id, patch) {
  const existing = await repo.get(req.supabase, id);
  if (!existing) throw new ApiError(404, 'NOT_FOUND', 'Treatment not found');
  return repo.update(req.supabase, id, patch);
}

async function cancelTreatment(req, id) {
  await repo.cancel(req.supabase, id);
}

module.exports = {
  listTreatments,
  getTreatment,
  createTreatment,
  updateTreatment,
  cancelTreatment,
};
