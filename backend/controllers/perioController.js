const service = require('../services/perioService');
const v = require('../validation/perio');
const { idParamSchema } = require('../validation/common');
const { ApiError } = require('../middleware/errorHandler');

function parseOrThrow(schema, value, where = 'body') {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new ApiError(400, 'VALIDATION', `Invalid ${where}`, result.error.flatten());
  }
  return result.data;
}

async function listCharts(req, res) {
  const query = parseOrThrow(v.perioChartListQuerySchema, req.query, 'query');
  res.json({ data: await service.listCharts(req, query) });
}

async function getChart(req, res) {
  const { id } = parseOrThrow(idParamSchema, req.params, 'params');
  res.json({ data: await service.getChart(req, id) });
}

async function createChart(req, res) {
  const input = parseOrThrow(v.perioChartCreateSchema, req.body, 'body');
  res.status(201).json({ data: await service.createChart(req, input) });
}

async function updateChart(req, res) {
  const { id } = parseOrThrow(idParamSchema, req.params, 'params');
  const patch = parseOrThrow(v.perioChartUpdateSchema, req.body, 'body');
  res.json({ data: await service.updateChart(req, id, patch) });
}

async function replaceSites(req, res) {
  const { id } = parseOrThrow(idParamSchema, req.params, 'params');
  const { sites } = parseOrThrow(v.perioSitesReplaceSchema, req.body, 'body');
  res.json({ data: await service.replaceSites(req, id, sites) });
}

async function deleteChart(req, res) {
  const { id } = parseOrThrow(idParamSchema, req.params, 'params');
  await service.deleteChart(req, id);
  res.status(204).end();
}

module.exports = {
  listCharts,
  getChart,
  createChart,
  updateChart,
  replaceSites,
  deleteChart,
};
