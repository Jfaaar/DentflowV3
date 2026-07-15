const service = require('../services/treatmentsService');
const {
  treatmentCreateSchema,
  treatmentUpdateSchema,
  treatmentsListQuerySchema,
} = require('../validation/treatments');
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
  const query = parseOrThrow(treatmentsListQuerySchema, req.query, 'query');
  res.json({ data: await service.listTreatments(req, query) });
}

async function get(req, res) {
  const { id } = parseOrThrow(idParamSchema, req.params, 'params');
  res.json({ data: await service.getTreatment(req, id) });
}

async function create(req, res) {
  const input = parseOrThrow(treatmentCreateSchema, req.body, 'body');
  res.status(201).json({ data: await service.createTreatment(req, input) });
}

async function update(req, res) {
  const { id } = parseOrThrow(idParamSchema, req.params, 'params');
  const patch = parseOrThrow(treatmentUpdateSchema, req.body, 'body');
  res.json({ data: await service.updateTreatment(req, id, patch) });
}

async function cancel(req, res) {
  const { id } = parseOrThrow(idParamSchema, req.params, 'params');
  await service.cancelTreatment(req, id);
  res.status(204).end();
}

module.exports = { list, get, create, update, cancel };
