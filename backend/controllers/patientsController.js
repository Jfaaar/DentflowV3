// Patients controller — validates input via zod, delegates to the service,
// returns the unified `{ data }` envelope. Errors flow through next() to the
// global error handler.
const service = require('../services/patientsService');
const {
  patientCreateSchema,
  patientUpdateSchema,
  patientsListQuerySchema,
} = require('../validation/patients');
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
  const query = parseOrThrow(patientsListQuerySchema, req.query, 'query');
  const result = await service.listPatients(req, query);
  res.json({ data: result });
}

async function get(req, res) {
  const { id } = parseOrThrow(idParamSchema, req.params, 'params');
  const patient = await service.getPatient(req, id);
  res.json({ data: patient });
}

async function create(req, res) {
  const input = parseOrThrow(patientCreateSchema, req.body, 'body');
  const patient = await service.createPatient(req, input);
  res.status(201).json({ data: patient });
}

async function update(req, res) {
  const { id } = parseOrThrow(idParamSchema, req.params, 'params');
  const patch = parseOrThrow(patientUpdateSchema, req.body, 'body');
  const patient = await service.updatePatient(req, id, patch);
  res.json({ data: patient });
}

async function archive(req, res) {
  const { id } = parseOrThrow(idParamSchema, req.params, 'params');
  await service.archivePatient(req, id);
  res.status(204).end();
}

async function remove(req, res) {
  const { id } = parseOrThrow(idParamSchema, req.params, 'params');
  await service.deletePatient(req, id);
  res.status(204).end();
}

module.exports = { list, get, create, update, archive, remove };
