// Specialty-gating middleware. Mount on a router/route to restrict access
// to clinics whose `clinic_settings.enabled_specialties` includes one of
// the required specialties. Falls back to deny if the clinic has no row
// in clinic_settings (the column defaults make new clinics general_practice).
//
// Usage:
//   router.use('/dental-chart', requireSpecialty(['dental']), ...handler)
const { ApiError } = require('./errorHandler');

function requireSpecialty(required) {
  if (!Array.isArray(required) || required.length === 0) {
    throw new Error('requireSpecialty: must pass a non-empty array of specialty codes');
  }

  return async function specialtyGate(req, _res, next) {
    try {
      const clinicId = req.user?.clinicId;
      if (!clinicId) {
        throw new ApiError(400, 'MISSING_CLINIC', 'User has no associated clinic');
      }

      // Cache per-request so repeated middleware invocations don't re-query.
      let enabled = req.clinicSettings?.enabledSpecialties;
      if (!enabled) {
        const r = await req.db.query(
          `SELECT enabled_specialties FROM clinic_settings WHERE clinic_id = $1 LIMIT 1`,
          [clinicId],
        );
        enabled = r.rows[0]?.enabled_specialties ?? [];
        req.clinicSettings = Object.assign(req.clinicSettings || {}, { enabledSpecialties: enabled });
      }

      const allowed = required.some((s) => enabled.includes(s));
      if (!allowed) {
        throw new ApiError(
          403,
          'SPECIALTY_DISABLED',
          `This feature requires one of: ${required.join(', ')}`,
          { required, enabled },
        );
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { requireSpecialty };
