const repo = require('../repositories/prescriptionsRepository');
const { ApiError } = require('../middleware/errorHandler');

function listPrescriptions(req, query) {
  return repo.list(req.db, query);
}

async function getPrescription(req, id) {
  const p = await repo.get(req.db, id);
  if (!p) throw new ApiError(404, 'NOT_FOUND', 'Prescription not found');
  return p;
}

function createPrescription(req, input) {
  if (!req.user?.clinicId) {
    throw new ApiError(400, 'MISSING_CLINIC', 'User has no associated clinic');
  }
  return repo.create(req.db, input, req.user.clinicId);
}

async function updatePrescription(req, id, patch) {
  const existing = await repo.get(req.db, id);
  if (!existing) throw new ApiError(404, 'NOT_FOUND', 'Prescription not found');
  return repo.update(req.db, id, patch);
}

async function deletePrescription(req, id) {
  await repo.remove(req.db, id);
}

module.exports = {
  listPrescriptions,
  getPrescription,
  createPrescription,
  updatePrescription,
  deletePrescription,
};
