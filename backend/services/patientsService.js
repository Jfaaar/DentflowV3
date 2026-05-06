// Patients business logic. Calls patientsRepository and enforces invariants
// that are above the data layer (e.g., clinic scoping on create).
const repo = require('../repositories/patientsRepository');
const { ApiError } = require('../middleware/errorHandler');

function listPatients(req, query) {
  return repo.list(req.supabase, query);
}

async function getPatient(req, id) {
  const patient = await repo.get(req.supabase, id);
  if (!patient) throw new ApiError(404, 'NOT_FOUND', 'Patient not found');
  return patient;
}

function createPatient(req, input) {
  if (!req.user?.clinicId) {
    throw new ApiError(400, 'MISSING_CLINIC', 'User has no associated clinic');
  }
  return repo.create(req.supabase, input, req.user.clinicId);
}

async function updatePatient(req, id, patch) {
  // Confirm existence so updates of nonexistent rows return 404 instead of 200.
  const existing = await repo.get(req.supabase, id);
  if (!existing) throw new ApiError(404, 'NOT_FOUND', 'Patient not found');
  return repo.update(req.supabase, id, patch);
}

async function archivePatient(req, id) {
  await repo.archive(req.supabase, id);
}

async function deletePatient(req, id) {
  await repo.remove(req.supabase, id);
}

module.exports = {
  listPatients,
  getPatient,
  createPatient,
  updatePatient,
  archivePatient,
  deletePatient,
};
