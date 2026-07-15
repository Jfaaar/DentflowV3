const service = require('../services/insuranceService');
const {
  policyCreateSchema,
  policyUpdateSchema,
  policiesListQuerySchema,
  claimCreateSchema,
  claimUpdateSchema,
  claimsListQuerySchema,
} = require('../validation/insurance');
const { idParamSchema } = require('../validation/common');
const { ApiError } = require('../middleware/errorHandler');

function parseOrThrow(schema, value, where = 'body') {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new ApiError(400, 'VALIDATION', `Invalid ${where}`, result.error.flatten());
  }
  return result.data;
}

// Providers
async function listProviders(req, res) {
  res.json({ data: await service.listProviders(req) });
}

// Policies
async function listPolicies(req, res) {
  const query = parseOrThrow(policiesListQuerySchema, req.query, 'query');
  res.json({ data: await service.listPolicies(req, query) });
}
async function getPolicy(req, res) {
  const { id } = parseOrThrow(idParamSchema, req.params, 'params');
  res.json({ data: await service.getPolicy(req, id) });
}
async function createPolicy(req, res) {
  const input = parseOrThrow(policyCreateSchema, req.body, 'body');
  res.status(201).json({ data: await service.createPolicy(req, input) });
}
async function updatePolicy(req, res) {
  const { id } = parseOrThrow(idParamSchema, req.params, 'params');
  const patch = parseOrThrow(policyUpdateSchema, req.body, 'body');
  res.json({ data: await service.updatePolicy(req, id, patch) });
}
async function deletePolicy(req, res) {
  const { id } = parseOrThrow(idParamSchema, req.params, 'params');
  await service.deletePolicy(req, id);
  res.status(204).end();
}

// Claims
async function listClaims(req, res) {
  const query = parseOrThrow(claimsListQuerySchema, req.query, 'query');
  res.json({ data: await service.listClaims(req, query) });
}
async function getClaim(req, res) {
  const { id } = parseOrThrow(idParamSchema, req.params, 'params');
  res.json({ data: await service.getClaim(req, id) });
}
async function createClaim(req, res) {
  const input = parseOrThrow(claimCreateSchema, req.body, 'body');
  res.status(201).json({ data: await service.createClaim(req, input) });
}
async function updateClaim(req, res) {
  const { id } = parseOrThrow(idParamSchema, req.params, 'params');
  const patch = parseOrThrow(claimUpdateSchema, req.body, 'body');
  res.json({ data: await service.updateClaim(req, id, patch) });
}

module.exports = {
  listProviders,
  listPolicies,
  getPolicy,
  createPolicy,
  updatePolicy,
  deletePolicy,
  listClaims,
  getClaim,
  createClaim,
  updateClaim,
};
