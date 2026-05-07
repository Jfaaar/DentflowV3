const repo = require('../repositories/treatmentPlansRepository');
const { ApiError } = require('../middleware/errorHandler');

function listTreatmentPlans(req, query) {
  return repo.list(req.db, query);
}

async function getTreatmentPlan(req, id) {
  const plan = await repo.get(req.db, id);
  if (!plan) throw new ApiError(404, 'NOT_FOUND', 'Treatment plan not found');
  return plan;
}

function createTreatmentPlan(req, input) {
  if (!req.user?.clinicId) {
    throw new ApiError(400, 'MISSING_CLINIC', 'User has no associated clinic');
  }
  return repo.create(req.db, input, req.user.clinicId);
}

async function updateTreatmentPlan(req, id, patch) {
  const existing = await repo.get(req.db, id);
  if (!existing) throw new ApiError(404, 'NOT_FOUND', 'Treatment plan not found');
  return repo.update(req.db, id, patch);
}

async function cancelTreatmentPlan(req, id) {
  await repo.cancel(req.db, id);
}

module.exports = {
  listTreatmentPlans,
  getTreatmentPlan,
  createTreatmentPlan,
  updateTreatmentPlan,
  cancelTreatmentPlan,
};
