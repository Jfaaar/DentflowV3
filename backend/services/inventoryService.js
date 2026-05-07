const repo = require('../repositories/inventoryRepository');
const { ApiError } = require('../middleware/errorHandler');

function listInventory(req, query) {
  return repo.list(req.db, query);
}

async function getInventoryItem(req, id) {
  const item = await repo.get(req.db, id);
  if (!item) throw new ApiError(404, 'NOT_FOUND', 'Inventory item not found');
  return item;
}

function createInventoryItem(req, input) {
  if (!req.user?.clinicId) {
    throw new ApiError(400, 'MISSING_CLINIC', 'User has no associated clinic');
  }
  return repo.create(req.db, input, req.user.clinicId);
}

async function updateInventoryItem(req, id, patch) {
  const existing = await repo.get(req.db, id);
  if (!existing) throw new ApiError(404, 'NOT_FOUND', 'Inventory item not found');
  return repo.update(req.db, id, patch);
}

async function archiveInventoryItem(req, id) {
  await repo.archive(req.db, id);
}

async function deleteInventoryItem(req, id) {
  await repo.remove(req.db, id);
}

async function adjustStock(req, id, delta, reason) {
  if (!req.user?.clinicId) {
    throw new ApiError(400, 'MISSING_CLINIC', 'User has no associated clinic');
  }
  const result = await repo.adjustStock(req.db, id, delta, reason, req.user.clinicId);
  if (!result) throw new ApiError(404, 'NOT_FOUND', 'Inventory item not found');
  return result;
}

module.exports = {
  listInventory,
  getInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  archiveInventoryItem,
  deleteInventoryItem,
  adjustStock,
};
