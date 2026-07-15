const repo = require('../repositories/paymentsRepository');
const { ApiError } = require('../middleware/errorHandler');

function listPayments(req, query) {
  return repo.list(req.db, query);
}

async function getPayment(req, id) {
  const p = await repo.get(req.db, id);
  if (!p) throw new ApiError(404, 'NOT_FOUND', 'Payment not found');
  return p;
}

function createPayment(req, input) {
  if (!req.user?.clinicId) {
    throw new ApiError(400, 'MISSING_CLINIC', 'User has no associated clinic');
  }
  return repo.create(req.db, input, req.user.clinicId);
}

async function updatePayment(req, id, patch) {
  const existing = await repo.get(req.db, id);
  if (!existing) throw new ApiError(404, 'NOT_FOUND', 'Payment not found');
  return repo.update(req.db, id, patch);
}

async function refundPayment(req, id) {
  await repo.refund(req.db, id);
}

module.exports = { listPayments, getPayment, createPayment, updatePayment, refundPayment };
