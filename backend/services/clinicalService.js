// Clinical bundle: notes + dental chart entries.
const notesRepo = require('../repositories/clinicalNotesRepository');
const chartRepo = require('../repositories/dentalChartRepository');
const { ApiError } = require('../middleware/errorHandler');

function requireClinic(req) {
  if (!req.user?.clinicId) {
    throw new ApiError(400, 'MISSING_CLINIC', 'User has no associated clinic');
  }
  return req.user.clinicId;
}

// Notes
function listNotes(req, query) {
  return notesRepo.list(req.supabase, query);
}

async function getNote(req, id) {
  const n = await notesRepo.get(req.supabase, id);
  if (!n) throw new ApiError(404, 'NOT_FOUND', 'Clinical note not found');
  return n;
}

function createNote(req, input) {
  return notesRepo.create(req.supabase, input, requireClinic(req));
}

async function updateNote(req, id, patch) {
  const existing = await notesRepo.get(req.supabase, id);
  if (!existing) throw new ApiError(404, 'NOT_FOUND', 'Clinical note not found');
  if (existing.signedAt) {
    throw new ApiError(400, 'NOTE_LOCKED', 'Cannot modify a signed clinical note');
  }
  return notesRepo.update(req.supabase, id, patch);
}

async function signNote(req, id) {
  const existing = await notesRepo.get(req.supabase, id);
  if (!existing) throw new ApiError(404, 'NOT_FOUND', 'Clinical note not found');
  if (existing.signedAt) return existing;
  return notesRepo.update(req.supabase, id, { signedAt: new Date().toISOString() });
}

async function deleteNote(req, id) {
  await notesRepo.remove(req.supabase, id);
}

// Dental chart
function listChartEntries(req, query) {
  return chartRepo.list(req.supabase, query);
}

async function getChartEntry(req, id) {
  const e = await chartRepo.get(req.supabase, id);
  if (!e) throw new ApiError(404, 'NOT_FOUND', 'Dental chart entry not found');
  return e;
}

function createChartEntry(req, input) {
  return chartRepo.create(req.supabase, input, requireClinic(req));
}

async function updateChartEntry(req, id, patch) {
  const existing = await chartRepo.get(req.supabase, id);
  if (!existing) throw new ApiError(404, 'NOT_FOUND', 'Dental chart entry not found');
  return chartRepo.update(req.supabase, id, patch);
}

async function deleteChartEntry(req, id) {
  await chartRepo.remove(req.supabase, id);
}

module.exports = {
  listNotes,
  getNote,
  createNote,
  updateNote,
  signNote,
  deleteNote,
  listChartEntries,
  getChartEntry,
  createChartEntry,
  updateChartEntry,
  deleteChartEntry,
};
