// Periodontal chart service — thin wrapper over the repository.
const repo = require('../repositories/perioRepository');
const { ApiError } = require('../middleware/errorHandler');

function requireClinic(req) {
  if (!req.user?.clinicId) {
    throw new ApiError(400, 'MISSING_CLINIC', 'User has no associated clinic');
  }
  return req.user.clinicId;
}

async function listCharts(req, query) {
  return repo.listCharts(req.db, query);
}

async function getChart(req, id) {
  const chart = await repo.getChartWithSites(req.db, id);
  if (!chart) throw new ApiError(404, 'NOT_FOUND', 'Perio chart not found');
  return chart;
}

async function createChart(req, input) {
  const clinicId = requireClinic(req);
  return repo.createChart(req.db, input, clinicId);
}

async function updateChart(req, id, patch) {
  const existing = await repo.getChartWithSites(req.db, id);
  if (!existing) throw new ApiError(404, 'NOT_FOUND', 'Perio chart not found');
  return repo.updateChart(req.db, id, patch);
}

async function replaceSites(req, id, sites) {
  const existing = await repo.getChartWithSites(req.db, id);
  if (!existing) throw new ApiError(404, 'NOT_FOUND', 'Perio chart not found');
  const clinicId = requireClinic(req);
  return repo.replaceSites(req.db, id, clinicId, sites);
}

async function deleteChart(req, id) {
  await repo.deleteChart(req.db, id);
}

module.exports = {
  listCharts,
  getChart,
  createChart,
  updateChart,
  replaceSites,
  deleteChart,
};
