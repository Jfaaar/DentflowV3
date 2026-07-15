// Patients business logic. Calls patientsRepository and enforces invariants
// that are above the data layer (e.g., clinic scoping on create).
const repo = require('../repositories/patientsRepository');
const { ApiError } = require('../middleware/errorHandler');

function listPatients(req, query) {
  return repo.list(req.db, query);
}

async function getPatient(req, id) {
  const patient = await repo.get(req.db, id);
  if (!patient) throw new ApiError(404, 'NOT_FOUND', 'Patient not found');
  return patient;
}

function createPatient(req, input) {
  if (!req.user?.clinicId) {
    throw new ApiError(400, 'MISSING_CLINIC', 'User has no associated clinic');
  }
  return repo.create(req.db, input, req.user.clinicId);
}

async function updatePatient(req, id, patch) {
  // Confirm existence so updates of nonexistent rows return 404 instead of 200.
  const existing = await repo.get(req.db, id);
  if (!existing) throw new ApiError(404, 'NOT_FOUND', 'Patient not found');
  return repo.update(req.db, id, patch);
}

async function archivePatient(req, id) {
  await repo.archive(req.db, id);
}

async function deletePatient(req, id) {
  await repo.remove(req.db, id);
}

module.exports = {
  listPatients,
  getPatient,
  createPatient,
  updatePatient,
  archivePatient,
  deletePatient,
};
