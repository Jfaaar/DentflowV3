const service = require('../services/appointmentsService');
const {
  appointmentCreateSchema,
  appointmentUpdateSchema,
  appointmentsListQuerySchema,
  cancelManyBodySchema,
  cancelBodySchema,
} = require('../validation/appointments');
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
  const query = parseOrThrow(appointmentsListQuerySchema, req.query, 'query');
  const result = await service.listAppointments(req, query);
  res.json({ data: result });
}

async function get(req, res) {
  const { id } = parseOrThrow(idParamSchema, req.params, 'params');
  res.json({ data: await service.getAppointment(req, id) });
}

async function create(req, res) {
  const input = parseOrThrow(appointmentCreateSchema, req.body, 'body');
  res.status(201).json({ data: await service.createAppointment(req, input) });
}

async function update(req, res) {
  const { id } = parseOrThrow(idParamSchema, req.params, 'params');
  const patch = parseOrThrow(appointmentUpdateSchema, req.body, 'body');
  res.json({ data: await service.updateAppointment(req, id, patch) });
}

async function cancel(req, res) {
  const { id } = parseOrThrow(idParamSchema, req.params, 'params');
  const { reason } = parseOrThrow(cancelBodySchema, req.body || {}, 'body');
  await service.cancelAppointment(req, id, reason);
  res.status(204).end();
}

async function cancelMany(req, res) {
  const { ids } = parseOrThrow(cancelManyBodySchema, req.body, 'body');
  await service.cancelManyAppointments(req, ids);
  res.status(204).end();
}

async function restore(req, res) {
  const { id } = parseOrThrow(idParamSchema, req.params, 'params');
  res.json({ data: await service.restoreAppointment(req, id) });
}

async function checkIn(req, res) {
  const { id } = parseOrThrow(idParamSchema, req.params, 'params');
  res.json({ data: await service.checkInAppointment(req, id) });
}

async function start(req, res) {
  const { id } = parseOrThrow(idParamSchema, req.params, 'params');
  res.json({ data: await service.startAppointment(req, id) });
}

async function complete(req, res) {
  const { id } = parseOrThrow(idParamSchema, req.params, 'params');
  res.json({ data: await service.completeAppointment(req, id) });
}

async function noShow(req, res) {
  const { id } = parseOrThrow(idParamSchema, req.params, 'params');
  res.json({ data: await service.markNoShow(req, id) });
}

module.exports = {
  list,
  get,
  create,
  update,
  cancel,
  cancelMany,
  restore,
  checkIn,
  start,
  complete,
  noShow,
};
