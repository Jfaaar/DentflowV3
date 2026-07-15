const service = require('../services/suppliersService');
const {
  supplierCreateSchema,
  supplierUpdateSchema,
  suppliersListQuerySchema,
} = require('../validation/suppliers');
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
  const query = parseOrThrow(suppliersListQuerySchema, req.query, 'query');
  res.json({ data: await service.listSuppliers(req, query) });
}

async function get(req, res) {
  const { id } = parseOrThrow(idParamSchema, req.params, 'params');
  res.json({ data: await service.getSupplier(req, id) });
}

async function create(req, res) {
  const input = parseOrThrow(supplierCreateSchema, req.body, 'body');
  res.status(201).json({ data: await service.createSupplier(req, input) });
}

async function update(req, res) {
  const { id } = parseOrThrow(idParamSchema, req.params, 'params');
  const patch = parseOrThrow(supplierUpdateSchema, req.body, 'body');
  res.json({ data: await service.updateSupplier(req, id, patch) });
}

async function remove(req, res) {
  const { id } = parseOrThrow(idParamSchema, req.params, 'params');
  await service.deleteSupplier(req, id);
  res.status(204).end();
}

module.exports = { list, get, create, update, remove };
