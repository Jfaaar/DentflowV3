const repo = require('../repositories/quotesRepository');
const { ApiError } = require('../middleware/errorHandler');

function listQuotes(req, query) {
  return repo.list(req.supabase, query);
}

async function getQuote(req, id) {
  const q = await repo.get(req.supabase, id);
  if (!q) throw new ApiError(404, 'NOT_FOUND', 'Quote not found');
  return q;
}

function createQuote(req, input) {
  if (!req.user?.clinicId) {
    throw new ApiError(400, 'MISSING_CLINIC', 'User has no associated clinic');
  }
  return repo.create(req.supabase, input, req.user.clinicId);
}

async function updateQuote(req, id, patch) {
  const existing = await repo.get(req.supabase, id);
  if (!existing) throw new ApiError(404, 'NOT_FOUND', 'Quote not found');
  return repo.update(req.supabase, id, patch);
}

async function expireQuote(req, id) {
  await repo.expire(req.supabase, id);
}

module.exports = { listQuotes, getQuote, createQuote, updateQuote, expireQuote };
