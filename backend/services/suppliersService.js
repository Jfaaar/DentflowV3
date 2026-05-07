const repo = require('../repositories/suppliersRepository');
const { ApiError } = require('../middleware/errorHandler');

function listSuppliers(req, query) {
  return repo.list(req.db, query);
}

async function getSupplier(req, id) {
  const s = await repo.get(req.db, id);
  if (!s) throw new ApiError(404, 'NOT_FOUND', 'Supplier not found');
  return s;
}

function createSupplier(req, input) {
  if (!req.user?.clinicId) {
    throw new ApiError(400, 'MISSING_CLINIC', 'User has no associated clinic');
  }
  return repo.create(req.db, input, req.user.clinicId);
}

async function updateSupplier(req, id, patch) {
  const existing = await repo.get(req.db, id);
  if (!existing) throw new ApiError(404, 'NOT_FOUND', 'Supplier not found');
  return repo.update(req.db, id, patch);
}

async function deleteSupplier(req, id) {
  await repo.remove(req.db, id);
}

module.exports = { listSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier };
