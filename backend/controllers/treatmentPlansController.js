const service = require('../services/treatmentPlansService');
const {
  treatmentPlanCreateSchema,
  treatmentPlanUpdateSchema,
  treatmentPlansListQuerySchema,
} = require('../validation/treatmentPlans');
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
  const query = parseOrThrow(treatmentPlansListQuerySchema, req.query, 'query');
  res.json({ data: await service.listTreatmentPlans(req, query) });
}

async function get(req, res) {
  const { id } = parseOrThrow(idParamSchema, req.params, 'params');
  res.json({ data: await service.getTreatmentPlan(req, id) });
}

async function create(req, res) {
  const input = parseOrThrow(treatmentPlanCreateSchema, req.body, 'body');
  res.status(201).json({ data: await service.createTreatmentPlan(req, input) });
}

async function update(req, res) {
  const { id } = parseOrThrow(idParamSchema, req.params, 'params');
  const patch = parseOrThrow(treatmentPlanUpdateSchema, req.body, 'body');
  res.json({ data: await service.updateTreatmentPlan(req, id, patch) });
}

async function cancel(req, res) {
  const { id } = parseOrThrow(idParamSchema, req.params, 'params');
  await service.cancelTreatmentPlan(req, id);
  res.status(204).end();
}

module.exports = { list, get, create, update, cancel };
