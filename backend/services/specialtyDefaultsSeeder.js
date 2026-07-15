// Lazy seeder for a pack's clinic-scoped defaults.
//
// Called from settingsService.updateSettings whenever the clinic's
// enabled_specialties array *grows*. Each entry in the registry receives
// the db connection and clinic_id and idempotently inserts that pack's seed
// rows. A handler throwing must not fail the settings update — seeds are
// best-effort — so each is run inside a try/catch here.
//
// Never act on a *removal* of a specialty — keep historical data; the
// feature gate alone stops surfacing it.

// ─── Dental: starter consumables / materials catalog ────────────────────────
const DENTAL_CATEGORY = 'Dental supplies';
const DENTAL_CATALOG = [
  { name: 'Composite resin (universal shade)',          type: 'dental_material', unit: 'syringe', minStock: 5 },
  { name: 'Anaesthetic carpules (lidocaine 2%)',        type: 'consumable',      unit: 'box',     minStock: 2 },
  { name: 'Dental burs (assorted)',                     type: 'consumable',      unit: 'pack',    minStock: 3 },
  { name: 'Endodontic files (K-files, assorted)',       type: 'consumable',      unit: 'pack',    minStock: 3 },
  { name: 'Impression material (alginate)',             type: 'dental_material', unit: 'bag',     minStock: 2 },
  { name: 'Impression material (silicone)',             type: 'dental_material', unit: 'kit',     minStock: 2 },
  { name: 'Gutta-percha points',                        type: 'dental_material', unit: 'box',     minStock: 3 },
  { name: 'Glass ionomer cement',                       type: 'dental_material', unit: 'kit',     minStock: 2 },
  { name: 'Etchant gel (37% phosphoric acid)',          type: 'dental_material', unit: 'syringe', minStock: 2 },
  { name: 'Bonding agent',                              type: 'dental_material', unit: 'bottle',  minStock: 2 },
  { name: 'Examination gloves (nitrile, M)',            type: 'consumable',      unit: 'box',     minStock: 5 },
  { name: 'Face masks (3-ply)',                         type: 'consumable',      unit: 'box',     minStock: 5 },
  { name: 'Saliva ejectors',                            type: 'consumable',      unit: 'pack',    minStock: 3 },
  { name: 'Cotton rolls',                               type: 'consumable',      unit: 'pack',    minStock: 5 },
  { name: 'Prophy paste',                               type: 'dental_material', unit: 'jar',     minStock: 2 },
  { name: 'Fluoride varnish',                           type: 'dental_material', unit: 'box',     minStock: 2 },
];

async function seedDental(db, clinicId) {
  // Idempotent: the marker category lets us re-run without duplicating.
  const existing = await db.query(
    `SELECT COUNT(*)::int AS n FROM inventory_items WHERE clinic_id = $1 AND category = $2`,
    [clinicId, DENTAL_CATEGORY],
  );
  if ((existing.rows[0]?.n ?? 0) > 0) return;

  const values = [];
  const params = [];
  for (const item of DENTAL_CATALOG) {
    const b = params.length;
    // columns: clinic_id, name, type, category, stock(0), min_stock, unit
    values.push(`($${b + 1}, $${b + 2}, $${b + 3}::inventory_type, $${b + 4}, 0, $${b + 5}, $${b + 6})`);
    params.push(clinicId, item.name, item.type, DENTAL_CATEGORY, item.minStock, item.unit);
  }
  await db.query(
    `INSERT INTO inventory_items (clinic_id, name, type, category, stock, min_stock, unit)
     VALUES ${values.join(', ')}`,
    params,
  );
  console.log(`[specialtyDefaultsSeeder] seeded ${DENTAL_CATALOG.length} dental inventory items for clinic ${clinicId}`);
}

// ─── No-op handlers for packs whose seeds haven't been written yet ──────────
function noopSeeder(code) {
  return async function seed(_db, clinicId) {
    console.log(
      `[specialtyDefaultsSeeder] no-op seed for specialty '${code}' on clinic ${clinicId} ` +
      `(replace with pack defaults in the corresponding Phase-N migration)`,
    );
  };
}

const SPECIALTY_SEEDERS = {
  general_practice: noopSeeder('general_practice'),
  dental:           seedDental,
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

async function seedSpecialtyDefaults(db, clinicId, addedCodes) {
  for (const code of addedCodes) {
    const seeder = SPECIALTY_SEEDERS[code];
    if (!seeder) continue;
    try {
      await seeder(db, clinicId);
    } catch (err) {
      // Best-effort — never let a seed failure roll back the settings update.
      console.error(`[specialtyDefaultsSeeder] seed for '${code}' failed:`, err.message);
    }
  }
}

module.exports = { seedSpecialtyDefaults, SPECIALTY_SEEDERS, DENTAL_CATALOG, DENTAL_CATEGORY };
