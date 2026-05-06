const repo = require('../repositories/settingsRepository');
const { ApiError } = require('../middleware/errorHandler');

function requireClinic(req) {
  if (!req.user?.clinicId) {
    throw new ApiError(400, 'MISSING_CLINIC', 'User has no associated clinic');
  }
  return req.user.clinicId;
}

async function getSettings(req) {
  const clinicId = requireClinic(req);
  const settings = await repo.get(req.supabase, clinicId);
  // Caller may receive null on first load; that's fine — clients render defaults.
  return settings;
}

function updateSettings(req, patch) {
  return repo.upsert(req.supabase, requireClinic(req), patch);
}

module.exports = { getSettings, updateSettings };
