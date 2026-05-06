const service = require('../services/quotesService');
const { quoteCreateSchema, quoteUpdateSchema, quotesListQuerySchema } = require('../validation/quotes');
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
  const query = parseOrThrow(quotesListQuerySchema, req.query, 'query');
  res.json({ data: await service.listQuotes(req, query) });
}

async function get(req, res) {
  const { id } = parseOrThrow(idParamSchema, req.params, 'params');
  res.json({ data: await service.getQuote(req, id) });
}

async function create(req, res) {
  const input = parseOrThrow(quoteCreateSchema, req.body, 'body');
  res.status(201).json({ data: await service.createQuote(req, input) });
}

async function update(req, res) {
  const { id } = parseOrThrow(idParamSchema, req.params, 'params');
  const patch = parseOrThrow(quoteUpdateSchema, req.body, 'body');
  res.json({ data: await service.updateQuote(req, id, patch) });
}

async function expire(req, res) {
  const { id } = parseOrThrow(idParamSchema, req.params, 'params');
  await service.expireQuote(req, id);
  res.status(204).end();
}

module.exports = { list, get, create, update, expire };
