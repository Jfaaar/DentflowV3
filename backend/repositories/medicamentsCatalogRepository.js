// AMMPS medicament catalog — pg.
// Global reference data (no clinic_id). snake_case columns at the DB boundary,
// camelCase DTOs above it.
const numOrNull = (v) => (v == null || v === '' ? null : Number(v));

const CATALOG_COLS = [
  'specialite',
  'dosage',
  'forme',
  'presentation',
  'pp_gn',
  'substance_active',
  'classe_therapeutique',
  'laboratoire',
  'statut_amm',
  'statut_commercialisation',
  'ppv',
  'ph',
  'pfht',
  'tva',
  'source_url',
  'source_hash',
  'last_synced_at',
];

// Fields that, when changed, are interesting enough to log to medicament_history.
// Splitting price vs status keeps `change_type` meaningful for downstream queries.
const PRICE_FIELDS = ['ppv', 'ph', 'pfht', 'tva'];
const STATUS_FIELDS = ['statut_amm', 'statut_commercialisation'];
const TRACKED_FIELDS = [
  'dosage',
  'forme',
  'presentation',
  'pp_gn',
  'substance_active',
  'classe_therapeutique',
  'laboratoire',
  ...STATUS_FIELDS,
  ...PRICE_FIELDS,
];

function fromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    specialite: row.specialite,
    dosage: row.dosage ?? null,
    forme: row.forme ?? null,
    presentation: row.presentation ?? null,
    ppGn: row.pp_gn ?? null,
    substanceActive: row.substance_active ?? null,
    classeTherapeutique: row.classe_therapeutique ?? null,
    laboratoire: row.laboratoire ?? null,
    statutAmm: row.statut_amm ?? null,
    statutCommercialisation: row.statut_commercialisation ?? null,
    ppv: numOrNull(row.ppv),
    ph: numOrNull(row.ph),
    pfht: numOrNull(row.pfht),
    tva: numOrNull(row.tva),
    sourceUrl: row.source_url,
    sourceHash: row.source_hash,
    lastSyncedAt: row.last_synced_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function historyFromDb(row) {
  return {
    id: row.id,
    medicamentCatalogId: row.medicament_catalog_id,
    syncRunId: row.sync_run_id ?? null,
    changeType: row.change_type,
    fieldName: row.field_name ?? null,
    oldValue: row.old_value,
    newValue: row.new_value,
    createdAt: row.created_at,
  };
}

// Compare two raw catalog row objects (snake_case keys) and return the list of
// field-level diffs that should be persisted to medicament_history.
function diffRows(prev, next) {
  const diffs = [];
  for (const f of TRACKED_FIELDS) {
    const a = prev[f];
    const b = next[f];
    // Treat null/undefined as equal; cast numerics to Number for comparison.
    const isNum = PRICE_FIELDS.includes(f) || f === 'tva';
    const av = a == null ? null : isNum ? Number(a) : String(a);
    const bv = b == null ? null : isNum ? Number(b) : String(b);
    if (av !== bv) {
      let changeType = 'field_change';
      if (PRICE_FIELDS.includes(f)) changeType = 'price_change';
      else if (STATUS_FIELDS.includes(f)) changeType = 'status_change';
      diffs.push({ field: f, changeType, oldValue: a ?? null, newValue: b ?? null });
    }
  }
  return diffs;
}

// Build the WHERE clause shared by list / listGroups. `specialite` (exact)
// is used by the variants drilldown; `search` matches on specialite or
// substance_active for the brand search box.
function buildFilters({ search, substance, laboratoire, specialite } = {}) {
  const where = [];
  const params = [];
  if (search?.trim()) {
    params.push(`%${search.trim()}%`);
    where.push(`(specialite ILIKE $${params.length} OR substance_active ILIKE $${params.length})`);
  }
  if (substance?.trim()) {
    params.push(`%${substance.trim()}%`);
    where.push(`substance_active ILIKE $${params.length}`);
  }
  if (laboratoire?.trim()) {
    params.push(`%${laboratoire.trim()}%`);
    where.push(`laboratoire ILIKE $${params.length}`);
  }
  if (specialite?.trim()) {
    params.push(specialite.trim());
    where.push(`specialite = $${params.length}`);
  }
  const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';
  return { whereSQL, params };
}

async function list(db, opts = {}) {
  const { page = 0, pageSize = 50 } = opts;
  const { whereSQL, params } = buildFilters(opts);

  params.push(pageSize); const limitIdx = params.length;
  params.push(page * pageSize); const offsetIdx = params.length;

  const dataSQL = `SELECT * FROM medicaments_catalog ${whereSQL}
                   ORDER BY specialite ASC, dosage ASC NULLS LAST, presentation ASC NULLS LAST
                   LIMIT $${limitIdx} OFFSET $${offsetIdx}`;
  const countParams = params.slice(0, params.length - 2);
  const countSQL = `SELECT COUNT(*)::int AS count FROM medicaments_catalog ${whereSQL}`;

  const [d, c] = await Promise.all([db.query(dataSQL, params), db.query(countSQL, countParams)]);
  return {
    data: d.rows.map(fromDb),
    page,
    pageSize,
    total: c.rows[0].count,
  };
}

// Brand-level grouping: one row per `specialite`. Variants of the same brand
// (different dosages/forms/presentations) collapse into a `variantCount` plus
// price range. Used by the dashboard grid so users see one card per brand
// rather than e.g. 46 LAMICTAL rows.
async function listGroups(db, opts = {}) {
  const { page = 0, pageSize = 24 } = opts;
  const { whereSQL, params } = buildFilters(opts);

  params.push(pageSize); const limitIdx = params.length;
  params.push(page * pageSize); const offsetIdx = params.length;

  // For each specialite we surface the most common laboratoire/substance
  // (MODE) since variants of the same brand almost always share these. Prices
  // collapse into min/max bounds. `commercializedCount` tells the UI how many
  // variants are still sold so it can flag a brand as fully discontinued.
  const dataSQL = `
    SELECT
      specialite,
      MODE() WITHIN GROUP (ORDER BY laboratoire)         AS laboratoire,
      MODE() WITHIN GROUP (ORDER BY substance_active)    AS substance_active,
      MODE() WITHIN GROUP (ORDER BY classe_therapeutique) AS classe_therapeutique,
      COUNT(*)::int                                      AS variant_count,
      MIN(NULLIF(ppv, 0))                                AS min_ppv,
      MAX(NULLIF(ppv, 0))                                AS max_ppv,
      COUNT(*) FILTER (
        WHERE statut_commercialisation ILIKE 'commercialis%'
      )::int                                             AS commercialized_count
    FROM medicaments_catalog
    ${whereSQL}
    GROUP BY specialite
    ORDER BY specialite ASC
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `;
  const countParams = params.slice(0, params.length - 2);
  const countSQL = `
    SELECT COUNT(*)::int AS count FROM (
      SELECT 1 FROM medicaments_catalog ${whereSQL} GROUP BY specialite
    ) g
  `;

  const [d, c] = await Promise.all([db.query(dataSQL, params), db.query(countSQL, countParams)]);
  return {
    data: d.rows.map((row) => ({
      specialite: row.specialite,
      laboratoire: row.laboratoire ?? null,
      substanceActive: row.substance_active ?? null,
      classeTherapeutique: row.classe_therapeutique ?? null,
      variantCount: row.variant_count,
      commercializedCount: row.commercialized_count,
      minPpv: numOrNull(row.min_ppv),
      maxPpv: numOrNull(row.max_ppv),
    })),
    page,
    pageSize,
    total: c.rows[0].count,
  };
}

// Catalog-wide totals for the dashboard stat cards.
async function getStats(db) {
  const r = await db.query(`
    SELECT
      COUNT(*)::int                            AS total_medicaments,
      COUNT(DISTINCT specialite)::int          AS total_brands,
      COUNT(DISTINCT laboratoire)::int         AS total_labs,
      COUNT(DISTINCT substance_active)::int    AS total_substances
    FROM medicaments_catalog
  `);
  const row = r.rows[0];
  return {
    totalMedicaments: row.total_medicaments,
    totalBrands: row.total_brands,
    totalLabs: row.total_labs,
    totalSubstances: row.total_substances,
  };
}

// Distinct laboratoire list (sorted, non-empty) for the filter dropdown.
async function listLabs(db) {
  const r = await db.query(`
    SELECT DISTINCT laboratoire
    FROM medicaments_catalog
    WHERE laboratoire IS NOT NULL AND laboratoire <> ''
    ORDER BY laboratoire ASC
  `);
  return r.rows.map((row) => row.laboratoire);
}

async function get(db, id) {
  const r = await db.query(`SELECT * FROM medicaments_catalog WHERE id = $1`, [id]);
  return fromDb(r.rows[0]);
}

async function findBySourceHash(db, hash) {
  const r = await db.query(`SELECT * FROM medicaments_catalog WHERE source_hash = $1`, [hash]);
  return r.rows[0] || null;
}

async function getPrice(db, id) {
  const r = await db.query(
    `SELECT ppv, ph, pfht, tva, last_synced_at
       FROM medicaments_catalog WHERE id = $1`,
    [id],
  );
  if (r.rowCount === 0) return null;
  const row = r.rows[0];
  return {
    ppv: numOrNull(row.ppv),
    ph: numOrNull(row.ph),
    pfht: numOrNull(row.pfht),
    tva: numOrNull(row.tva),
    lastSyncedAt: row.last_synced_at,
  };
}

async function listHistory(db, id, { page = 0, pageSize = 50 } = {}) {
  const dataSQL = `SELECT * FROM medicament_history
                   WHERE medicament_catalog_id = $1
                   ORDER BY created_at DESC
                   LIMIT $2 OFFSET $3`;
  const countSQL = `SELECT COUNT(*)::int AS count FROM medicament_history
                    WHERE medicament_catalog_id = $1`;
  const [d, c] = await Promise.all([
    db.query(dataSQL, [id, pageSize, page * pageSize]),
    db.query(countSQL, [id]),
  ]);
  return {
    data: d.rows.map(historyFromDb),
    page,
    pageSize,
    total: c.rows[0].count,
  };
}

// Upsert by source_hash. If the row exists and tracked fields changed, append
// per-field history rows. Returns { id, action: 'created'|'updated'|'unchanged' }.
async function upsert(db, row, syncRunId) {
  const existing = await findBySourceHash(db, row.source_hash);

  if (!existing) {
    const cols = CATALOG_COLS.join(', ');
    const placeholders = CATALOG_COLS.map((_, i) => `$${i + 1}`).join(', ');
    const values = CATALOG_COLS.map((c) => row[c] ?? null);
    const r = await db.query(
      `INSERT INTO medicaments_catalog (${cols}) VALUES (${placeholders}) RETURNING id`,
      values,
    );
    const id = r.rows[0].id;
    await db.query(
      `INSERT INTO medicament_history
         (medicament_catalog_id, sync_run_id, change_type, field_name, old_value, new_value)
       VALUES ($1, $2, 'created', NULL, NULL, $3)`,
      [id, syncRunId, JSON.stringify(row)],
    );
    return { id, action: 'created' };
  }

  const diffs = diffRows(existing, row);

  // No tracked changes — just bump last_synced_at and exit.
  if (diffs.length === 0) {
    await db.query(
      `UPDATE medicaments_catalog SET last_synced_at = $1 WHERE id = $2`,
      [row.last_synced_at, existing.id],
    );
    return { id: existing.id, action: 'unchanged' };
  }

  // Update all CATALOG_COLS in one statement (cheap, keeps row internally consistent).
  const setSQL = CATALOG_COLS.map((c, i) => `${c} = $${i + 1}`).join(', ');
  const values = CATALOG_COLS.map((c) => row[c] ?? null);
  values.push(existing.id);
  await db.query(
    `UPDATE medicaments_catalog SET ${setSQL} WHERE id = $${values.length}`,
    values,
  );

  // Bulk-insert history rows.
  const histPlaceholders = [];
  const histValues = [];
  let p = 1;
  for (const d of diffs) {
    histValues.push(
      existing.id,
      syncRunId,
      d.changeType,
      d.field,
      d.oldValue == null ? null : JSON.stringify(d.oldValue),
      d.newValue == null ? null : JSON.stringify(d.newValue),
    );
    histPlaceholders.push(
      `($${p++}, $${p++}, $${p++}, $${p++}, $${p++}::jsonb, $${p++}::jsonb)`,
    );
  }
  await db.query(
    `INSERT INTO medicament_history
       (medicament_catalog_id, sync_run_id, change_type, field_name, old_value, new_value)
     VALUES ${histPlaceholders.join(', ')}`,
    histValues,
  );

  return { id: existing.id, action: 'updated' };
}

module.exports = {
  list,
  listGroups,
  getStats,
  listLabs,
  get,
  findBySourceHash,
  getPrice,
  listHistory,
  upsert,
  // exported for tests:
  diffRows,
};
