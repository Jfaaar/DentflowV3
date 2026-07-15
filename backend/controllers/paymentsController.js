const service = require('../services/paymentsService');
const {
  paymentCreateSchema,
  paymentUpdateSchema,
  paymentsListQuerySchema,
} = require('../validation/payments');
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
  const query = parseOrThrow(paymentsListQuerySchema, req.query, 'query');
  res.json({ data: await service.listPayments(req, query) });
}

async function get(req, res) {
  const { id } = parseOrThrow(idParamSchema, req.params, 'params');
  res.json({ data: await service.getPayment(req, id) });
}

async function create(req, res) {
  const input = parseOrThrow(paymentCreateSchema, req.body, 'body');
  res.status(201).json({ data: await service.createPayment(req, input) });
}

async function update(req, res) {
  const { id } = parseOrThrow(idParamSchema, req.params, 'params');
  const patch = parseOrThrow(paymentUpdateSchema, req.body, 'body');
  res.json({ data: await service.updatePayment(req, id, patch) });
}

async function refund(req, res) {
  const { id } = parseOrThrow(idParamSchema, req.params, 'params');
  await service.refundPayment(req, id);
  res.status(204).end();
}

module.exports = { list, get, create, update, refund };
