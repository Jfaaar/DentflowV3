const service = require('../services/medicamentsCatalogService');
const {
  medicamentsListQuerySchema,
  medicamentGroupsQuerySchema,
  medicamentHistoryQuerySchema,
} = require('../validation/medicamentsCatalog');
const { idParamSchema } = require('../validation/common');
const { ApiError } = require('../middleware/errorHandler');

function parseOrThrow(schema, value, where = 'body') {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new ApiError(400, 'VALIDATION', `Invalid ${where}`, result.error.flatten());
  }
  return result.data;
}

async function list(req, res) {
  const query = parseOrThrow(medicamentsListQuerySchema, req.query, 'query');
  res.json({ data: await service.listMedicaments(req, query) });
}

async function listGroups(req, res) {
  const query = parseOrThrow(medicamentGroupsQuerySchema, req.query, 'query');
  res.json({ data: await service.listMedicamentGroups(req, query) });
}

async function stats(req, res) {
  res.json({ data: await service.getCatalogStats(req) });
}

async function labs(req, res) {
  res.json({ data: await service.listLabs(req) });
}

async function get(req, res) {
  const { id } = parseOrThrow(idParamSchema, req.params, 'params');
  res.json({ data: await service.getMedicament(req, id) });
}

async function getPrice(req, res) {
  const { id } = parseOrThrow(idParamSchema, req.params, 'params');
  res.json({ data: await service.getMedicamentPrice(req, id) });
}

async function history(req, res) {
  const { id } = parseOrThrow(idParamSchema, req.params, 'params');
  const query = parseOrThrow(medicamentHistoryQuerySchema, req.query, 'query');
  res.json({ data: await service.listMedicamentHistory(req, id, query) });
}

module.exports = { list, listGroups, stats, labs, get, getPrice, history };
