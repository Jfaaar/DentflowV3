const repo = require('../repositories/appointmentsRepository');
const { ApiError } = require('../middleware/errorHandler');

function listAppointments(req, query) {
  return repo.list(req.db, query);
}

async function getAppointment(req, id) {
  const apt = await repo.get(req.db, id);
  if (!apt) throw new ApiError(404, 'NOT_FOUND', 'Appointment not found');
  return apt;
}

function createAppointment(req, input) {
  if (!req.user?.clinicId) {
    throw new ApiError(400, 'MISSING_CLINIC', 'User has no associated clinic');
  }
  return repo.create(req.db, input, req.user.clinicId);
}

async function updateAppointment(req, id, patch) {
  const existing = await repo.get(req.db, id);
  if (!existing) throw new ApiError(404, 'NOT_FOUND', 'Appointment not found');
  return repo.update(req.db, id, patch);
}

async function cancelAppointment(req, id, reason) {
  await repo.cancel(req.db, id, reason);
}

async function cancelManyAppointments(req, ids) {
  await repo.cancelMany(req.db, ids);
}

async function restoreAppointment(req, id) {
  const existing = await repo.get(req.db, id);
  if (!existing) throw new ApiError(404, 'NOT_FOUND', 'Appointment not found');
  return repo.update(req.db, id, { status: 'pending' });
}

async function checkInAppointment(req, id) {
  const apt = await repo.checkIn(req.db, id, req.user?.id);
  if (!apt) throw new ApiError(404, 'NOT_FOUND', 'Appointment not found');
  return apt;
}

async function startAppointment(req, id) {
  const apt = await repo.start(req.db, id, req.user?.id);
  if (!apt) throw new ApiError(404, 'NOT_FOUND', 'Appointment not found');
  return apt;
}

async function completeAppointment(req, id) {
  const apt = await repo.complete(req.db, id, req.user?.id);
  if (!apt) throw new ApiError(404, 'NOT_FOUND', 'Appointment not found');
  return apt;
}

async function markNoShow(req, id) {
  const apt = await repo.noShow(req.db, id, req.user?.id);
  if (!apt) throw new ApiError(404, 'NOT_FOUND', 'Appointment not found');
  return apt;
}

module.exports = {
  listAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  cancelManyAppointments,
  restoreAppointment,
  checkInAppointment,
  startAppointment,
  completeAppointment,
  markNoShow,
};
