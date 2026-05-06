const repo = require('../repositories/invoicesRepository');
const { ApiError } = require('../middleware/errorHandler');

function listInvoices(req, query) {
  return repo.list(req.supabase, query);
}

async function getInvoice(req, id) {
  const inv = await repo.get(req.supabase, id);
  if (!inv) throw new ApiError(404, 'NOT_FOUND', 'Invoice not found');
  return inv;
}

function createInvoice(req, input) {
  if (!req.user?.clinicId) {
    throw new ApiError(400, 'MISSING_CLINIC', 'User has no associated clinic');
  }
  return repo.create(req.supabase, input, req.user.clinicId);
}

async function updateInvoice(req, id, patch) {
  const existing = await repo.get(req.supabase, id);
  if (!existing) throw new ApiError(404, 'NOT_FOUND', 'Invoice not found');
  return repo.update(req.supabase, id, patch);
}

async function voidInvoice(req, id) {
  await repo.voidInvoice(req.supabase, id);
}

module.exports = { listInvoices, getInvoice, createInvoice, updateInvoice, voidInvoice };
