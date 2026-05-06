const service = require('../services/inventoryService');
const {
  inventoryItemCreateSchema,
  inventoryItemUpdateSchema,
  inventoryListQuerySchema,
  adjustStockBodySchema,
} = require('../validation/inventory');
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
  const query = parseOrThrow(inventoryListQuerySchema, req.query, 'query');
  res.json({ data: await service.listInventory(req, query) });
}

async function get(req, res) {
  const { id } = parseOrThrow(idParamSchema, req.params, 'params');
  res.json({ data: await service.getInventoryItem(req, id) });
}

async function create(req, res) {
  const input = parseOrThrow(inventoryItemCreateSchema, req.body, 'body');
  res.status(201).json({ data: await service.createInventoryItem(req, input) });
}

async function update(req, res) {
  const { id } = parseOrThrow(idParamSchema, req.params, 'params');
  const patch = parseOrThrow(inventoryItemUpdateSchema, req.body, 'body');
  res.json({ data: await service.updateInventoryItem(req, id, patch) });
}

async function archive(req, res) {
  const { id } = parseOrThrow(idParamSchema, req.params, 'params');
  await service.archiveInventoryItem(req, id);
  res.status(204).end();
}

async function remove(req, res) {
  const { id } = parseOrThrow(idParamSchema, req.params, 'params');
  await service.deleteInventoryItem(req, id);
  res.status(204).end();
}

async function adjustStock(req, res) {
  const { id } = parseOrThrow(idParamSchema, req.params, 'params');
  const { delta, reason } = parseOrThrow(adjustStockBodySchema, req.body, 'body');
  res.json({ data: await service.adjustStock(req, id, delta, reason) });
}

module.exports = { list, get, create, update, archive, remove, adjustStock };
