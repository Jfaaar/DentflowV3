const repo = require('../repositories/inventoryTransactionsRepository');
const { ApiError } = require('../middleware/errorHandler');

function listInventoryTransactions(req, query) {
  return repo.list(req.db, query);
}

async function getInventoryTransaction(req, id) {
  const t = await repo.get(req.db, id);
  if (!t) throw new ApiError(404, 'NOT_FOUND', 'Transaction not found');
  return t;
}

function createInventoryTransaction(req, input) {
  if (!req.user?.clinicId) {
    throw new ApiError(400, 'MISSING_CLINIC', 'User has no associated clinic');
  }
  return repo.create(req.db, input, req.user.clinicId);
}

async function deleteInventoryTransaction(req, id) {
  await repo.remove(req.db, id);
}

module.exports = {
  listInventoryTransactions,
  getInventoryTransaction,
  createInventoryTransaction,
  deleteInventoryTransaction,
};
