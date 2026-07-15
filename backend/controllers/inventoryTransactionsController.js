const service = require('../services/inventoryTransactionsService');
const {
  inventoryTxnCreateSchema,
  inventoryTxnListQuerySchema,
} = require('../validation/inventoryTransactions');
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
  const query = parseOrThrow(inventoryTxnListQuerySchema, req.query, 'query');
  res.json({ data: await service.listInventoryTransactions(req, query) });
}

async function get(req, res) {
  const { id } = parseOrThrow(idParamSchema, req.params, 'params');
  res.json({ data: await service.getInventoryTransaction(req, id) });
}

async function create(req, res) {
  const input = parseOrThrow(inventoryTxnCreateSchema, req.body, 'body');
  res.status(201).json({ data: await service.createInventoryTransaction(req, input) });
}

async function remove(req, res) {
  const { id } = parseOrThrow(idParamSchema, req.params, 'params');
  await service.deleteInventoryTransaction(req, id);
  res.status(204).end();
}

module.exports = { list, get, create, remove };
