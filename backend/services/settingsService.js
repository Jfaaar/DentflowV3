const repo = require('../repositories/settingsRepository');
const { ApiError } = require('../middleware/errorHandler');
const { seedSpecialtyDefaults } = require('./specialtyDefaultsSeeder');

function requireClinic(req) {
  if (!req.user?.clinicId) {
    throw new ApiError(400, 'MISSING_CLINIC', 'User has no associated clinic');
  }
  return req.user.clinicId;
}

async function getSettings(req) {
  const clinicId = requireClinic(req);
  const settings = await repo.get(req.db, clinicId);
  // Caller may receive null on first load; that's fine — clients render defaults.
  return settings;
}

async function updateSettings(req, patch) {
  const clinicId = requireClinic(req);

  // Detect specialties added on this update so we can lazily seed each pack's
  // clinic-scoped defaults (appointment types, document kinds, certificate /
  // referral templates) the first time a clinic enables one. Never act on
  // shrink — keep historical data; just stop surfacing it via feature gates.
  const before = await repo.get(req.db, clinicId);
  const updated = await repo.upsert(req.db, clinicId, patch);

  if (Array.isArray(patch.enabledSpecialties)) {
    const beforeSet = new Set(before?.enabledSpecialties ?? []);
    const added = updated.enabledSpecialties.filter((s) => !beforeSet.has(s));
    if (added.length > 0) {
      await seedSpecialtyDefaults(req.db, clinicId, added);
    }
  }

  return updated;
}

module.exports = { getSettings, updateSettings };
