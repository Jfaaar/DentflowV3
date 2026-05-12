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

async function acceptTreatmentPlan(req, id) {
  const existing = await repo.get(req.db, id);
  if (!existing) throw new ApiError(404, 'NOT_FOUND', 'Treatment plan not found');
  return repo.setStatus(req.db, id, 'accepted', { acceptedAt: new Date().toISOString() });
}

async function rejectTreatmentPlan(req, id) {
  const existing = await repo.get(req.db, id);
  if (!existing) throw new ApiError(404, 'NOT_FOUND', 'Treatment plan not found');
  return repo.setStatus(req.db, id, 'rejected');
}

async function listItems(req, planId) {
  return repo.listItems(req.db, planId);
}

async function addItem(req, planId, input) {
  if (!req.user?.clinicId) {
    throw new ApiError(400, 'MISSING_CLINIC', 'User has no associated clinic');
  }
  const item = await repo.addItem(req.db, planId, input, req.user.clinicId);
  if (!item) throw new ApiError(404, 'NOT_FOUND', 'Treatment plan not found');
  return item;
}

async function removeItem(req, itemId) {
  const ok = await repo.removeItem(req.db, itemId);
  if (!ok) throw new ApiError(404, 'NOT_FOUND', 'Item not found');
}

async function convertPlanToInvoice(req, id) {
  if (!req.user?.clinicId) {
    throw new ApiError(400, 'MISSING_CLINIC', 'User has no associated clinic');
  }
  const result = await repo.convertToInvoice(req.db, id, req.user.clinicId);
  if (result.error) throw new ApiError(400, 'CONVERT_FAILED', result.error);
  return result;
}

async function convertPlanToAppointments(req, id, opts) {
  if (!req.user?.clinicId) {
    throw new ApiError(400, 'MISSING_CLINIC', 'User has no associated clinic');
  }
  const result = await repo.convertToAppointments(req.db, id, req.user.clinicId, opts);
  if (result.error) throw new ApiError(400, 'CONVERT_FAILED', result.error);
  return result;
}

module.exports = {
  listTreatmentPlans,
  getTreatmentPlan,
  createTreatmentPlan,
  updateTreatmentPlan,
  cancelTreatmentPlan,
  acceptTreatmentPlan,
  rejectTreatmentPlan,
  listItems,
  addItem,
  removeItem,
  convertPlanToInvoice,
  convertPlanToAppointments,
};
