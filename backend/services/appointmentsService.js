const repo = require('../repositories/appointmentsRepository');
const { ApiError } = require('../middleware/errorHandler');

function listAppointments(req, query) {
  return repo.list(req.supabase, query);
}

async function getAppointment(req, id) {
  const apt = await repo.get(req.supabase, id);
  if (!apt) throw new ApiError(404, 'NOT_FOUND', 'Appointment not found');
  return apt;
}

function createAppointment(req, input) {
  if (!req.user?.clinicId) {
    throw new ApiError(400, 'MISSING_CLINIC', 'User has no associated clinic');
  }
  return repo.create(req.supabase, input, req.user.clinicId);
}

async function updateAppointment(req, id, patch) {
  const existing = await repo.get(req.supabase, id);
  if (!existing) throw new ApiError(404, 'NOT_FOUND', 'Appointment not found');
  return repo.update(req.supabase, id, patch);
}

async function cancelAppointment(req, id, reason) {
  await repo.cancel(req.supabase, id, reason);
}

async function cancelManyAppointments(req, ids) {
  await repo.cancelMany(req.supabase, ids);
}

async function restoreAppointment(req, id) {
  const existing = await repo.get(req.supabase, id);
  if (!existing) throw new ApiError(404, 'NOT_FOUND', 'Appointment not found');
  return repo.update(req.supabase, id, { status: 'pending' });
}

module.exports = {
  listAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  cancelManyAppointments,
  restoreAppointment,
};
