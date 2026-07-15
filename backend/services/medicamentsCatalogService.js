const repo = require('../repositories/medicamentsCatalogRepository');
const { ApiError } = require('../middleware/errorHandler');

function listMedicaments(req, query) {
  return repo.list(req.db, query);
}

function listMedicamentGroups(req, query) {
  return repo.listGroups(req.db, query);
}

function getCatalogStats(req) {
  return repo.getStats(req.db);
}

function listLabs(req) {
  return repo.listLabs(req.db);
}

async function getMedicament(req, id) {
  const m = await repo.get(req.db, id);
  if (!m) throw new ApiError(404, 'NOT_FOUND', 'Medicament not found');
  return m;
}

async function getMedicamentPrice(req, id) {
  const p = await repo.getPrice(req.db, id);
  if (!p) throw new ApiError(404, 'NOT_FOUND', 'Medicament not found');
  return p;
}

async function listMedicamentHistory(req, id, query) {
  // Confirm the catalog row exists so callers get 404 vs an empty list for
  // a typo'd id.
  const m = await repo.get(req.db, id);
  if (!m) throw new ApiError(404, 'NOT_FOUND', 'Medicament not found');
  return repo.listHistory(req.db, id, query);
}

module.exports = {
  listMedicaments,
  listMedicamentGroups,
  getCatalogStats,
  listLabs,
  getMedicament,
  getMedicamentPrice,
  listMedicamentHistory,
};
