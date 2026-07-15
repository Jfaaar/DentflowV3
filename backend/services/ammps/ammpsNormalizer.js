// Normalize a parsed AMMPS row into a catalog row (keyed by snake_case DB
// column names) plus a stable source_hash used as the upsert key.
const crypto = require('crypto');

const HASH_FIELDS = ['specialite', 'dosage', 'forme', 'presentation', 'laboratoire'];

function normString(s) {
  if (s == null) return '';
  return String(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function computeSourceHash(row) {
  const key = HASH_FIELDS.map((f) => normString(row[f])).join('|');
  return crypto.createHash('sha256').update(key).digest('hex');
}

// normalize(rawRow, { sourceUrl, syncedAt }) → catalog row keyed by DB columns,
// ready to hand to medicamentsCatalogRepository.upsert().
function normalize(raw, { sourceUrl, syncedAt } = {}) {
  if (!raw || !raw.specialite) {
    throw new Error('normalize: missing required field `specialite`');
  }
  const row = {
    specialite: raw.specialite ?? null,
    dosage: raw.dosage ?? null,
    forme: raw.forme ?? null,
    presentation: raw.presentation ?? null,
    pp_gn: raw.pp_gn ?? null,
    substance_active: raw.substance_active ?? null,
    classe_therapeutique: raw.classe_therapeutique ?? null,
    laboratoire: raw.laboratoire ?? null,
    statut_amm: raw.statut_amm ?? null,
    statut_commercialisation: raw.statut_commercialisation ?? null,
    ppv: raw.ppv ?? null,
    ph: raw.ph ?? null,
    pfht: raw.pfht ?? null,
    tva: raw.tva ?? null,
    source_url: raw.source_url || sourceUrl || null,
    last_synced_at: syncedAt || new Date(),
  };
  row.source_hash = computeSourceHash(row);
  return row;
}

module.exports = { normalize, computeSourceHash, normString };
