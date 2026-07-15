const service = require('../services/prescriptionsService');
const {
  prescriptionCreateSchema,
  prescriptionUpdateSchema,
  prescriptionsListQuerySchema,
} = require('../validation/prescriptions');
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
  const query = parseOrThrow(prescriptionsListQuerySchema, req.query, 'query');
  res.json({ data: await service.listPrescriptions(req, query) });
}

async function get(req, res) {
  const { id } = parseOrThrow(idParamSchema, req.params, 'params');
  res.json({ data: await service.getPrescription(req, id) });
}

async function create(req, res) {
  const input = parseOrThrow(prescriptionCreateSchema, req.body, 'body');
  res.status(201).json({ data: await service.createPrescription(req, input) });
}

async function update(req, res) {
  const { id } = parseOrThrow(idParamSchema, req.params, 'params');
  const patch = parseOrThrow(prescriptionUpdateSchema, req.body, 'body');
  res.json({ data: await service.updatePrescription(req, id, patch) });
}

async function remove(req, res) {
  const { id } = parseOrThrow(idParamSchema, req.params, 'params');
  await service.deletePrescription(req, id);
  res.status(204).end();
}

module.exports = { list, get, create, update, remove };
