const service = require('../services/settingsService');
const { clinicSettingsUpdateSchema } = require('../validation/settings');
const { ApiError } = require('../middleware/errorHandler');

function parseOrThrow(schema, value, where = 'body') {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new ApiError(400, 'VALIDATION', `Invalid ${where}`, result.error.flatten());
  }
  return result.data;
}

async function get(req, res) {
  res.json({ data: await service.getSettings(req) });
}

async function update(req, res) {
  const patch = parseOrThrow(clinicSettingsUpdateSchema, req.body, 'body');
  res.json({ data: await service.updateSettings(req, patch) });
}

module.exports = { get, update };
