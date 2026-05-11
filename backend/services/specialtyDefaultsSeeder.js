// Lazy seeder for a pack's clinic-scoped defaults.
//
// Called from settingsService.updateSettings whenever the clinic's
// enabled_specialties array *grows*. Each entry in the registry receives
// the db connection and clinic_id, and is responsible for idempotently
// inserting that pack's seed rows (appointment types, document kinds,
// certificate/referral templates, dashboard presets — when those tables
// exist in Phase 6+).
//
// Phase 0: this is the wiring hook. Every per-specialty handler is a no-op
// (logged) until its pack phase fills it in. Each pack PR adds its handler
// here without touching the call site.
//
// Never act on a *removal* of a specialty — keep historical data; the
// feature gate alone stops surfacing it.

const SPECIALTY_SEEDERS = {
  general_practice: noopSeeder('general_practice'),
  dental:           noopSeeder('dental'),
  pediatrics:       noopSeeder('pediatrics'),
  gynecology:       noopSeeder('gynecology'),
  cardiology:       noopSeeder('cardiology'),
  dermatology:      noopSeeder('dermatology'),
  ent:              noopSeeder('ent'),
  ophthalmology:    noopSeeder('ophthalmology'),
  orthopedics:      noopSeeder('orthopedics'),
  psychiatry:       noopSeeder('psychiatry'),
  other:            noopSeeder('other'),
};

function noopSeeder(code) {
  return async function seed(_db, clinicId) {
    // Replace this no-op with the pack's INSERTs in its Phase-N PR.
    console.log(
      `[specialtyDefaultsSeeder] no-op seed for specialty '${code}' on clinic ${clinicId} ` +
      `(replace with pack defaults in the corresponding Phase-N migration)`,
    );
  };
}

async function seedSpecialtyDefaults(db, clinicId, addedCodes) {
  for (const code of addedCodes) {
    const seeder = SPECIALTY_SEEDERS[code];
    if (!seeder) continue;
    await seeder(db, clinicId);
  }
}

module.exports = { seedSpecialtyDefaults, SPECIALTY_SEEDERS };
