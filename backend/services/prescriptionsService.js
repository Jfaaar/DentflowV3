const repo = require('../repositories/prescriptionsRepository');
const { ApiError } = require('../middleware/errorHandler');

function listPrescriptions(req, query) {
  return repo.list(req.supabase, query);
}

async function getPrescription(req, id) {
  const p = await repo.get(req.supabase, id);
  if (!p) throw new ApiError(404, 'NOT_FOUND', 'Prescription not found');
  return p;
}

function createPrescription(req, input) {
  if (!req.user?.clinicId) {
    throw new ApiError(400, 'MISSING_CLINIC', 'User has no associated clinic');
  }
  return repo.create(req.supabase, input, req.user.clinicId);
}

async function updatePrescription(req, id, patch) {
  const existing = await repo.get(req.supabase, id);
  if (!existing) throw new ApiError(404, 'NOT_FOUND', 'Prescription not found');
  return repo.update(req.supabase, id, patch);
}

async function deletePrescription(req, id) {
  await repo.remove(req.supabase, id);
}

module.exports = {
  listPrescriptions,
  getPrescription,
  createPrescription,
  updatePrescription,
  deletePrescription,
};
