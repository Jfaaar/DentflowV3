#!/usr/bin/env node
// Import medicaments_catalog rows from a local JSONL dump (medicaments data/).
// Bypasses the live AMMPS scraper — useful for offline/dev seeding when the
// upstream site is unreachable. Each line is one medicament with shape:
//   { id, name, subtitle, substance_active, epi, dosage, forme, presentation,
//     statut_commercialisation, ppv, ph, rcp_url, scraped_page, scraped_at }
//
// Usage: `npm run import:medicaments` from backend/, or pass a path:
//   node scripts/importMedicamentsFromJsonl.js /abs/path/to/medicaments.jsonl
const path = require('path');
const fs = require('fs');
const readline = require('readline');
require('dotenv').config({ path: path.join(__dirname, '..', '..', 'frontend', '.env.local') });

const { getPool, closePool } = require('../db/pg');
const catalogRepo = require('../repositories/medicamentsCatalogRepository');
const syncRepo = require('../repositories/medicamentSyncRepository');
const normalizer = require('../services/ammps/ammpsNormalizer');

const DEFAULT_PATH = path.join(
  __dirname, '..', '..', 'medicaments data', 'medicaments.jsonl',
);

// Parse Moroccan price strings. Two observed formats:
//   "10,70 DH"        → 10.70   (French: comma decimal)
//   "4.303.00 DH"     → 4303.00 (dots as both thousands and decimal)
//   "SANS PPV DH"     → null
function parsePrice(s) {
  if (s == null) return null;
  const txt = String(s).trim();
  if (!txt || /sans/i.test(txt)) return null;
  const m = txt.match(/[\d.,]+/);
  if (!m) return null;
  let n = m[0];
  if (n.includes(',')) {
    // French: dots are thousands, comma is decimal.
    n = n.replace(/\./g, '').replace(',', '.');
  } else if (n.includes('.')) {
    const parts = n.split('.');
    const last = parts[parts.length - 1];
    // Last group is exactly 2 digits → treat as decimal, prior dots as thousands.
    if (parts.length >= 2 && last.length === 2) {
      n = parts.slice(0, -1).join('') + '.' + last;
    } else {
      // All dots are thousands separators (e.g. "1.500" → 1500).
      n = parts.join('');
    }
  }
  const parsed = Number(n);
  return Number.isFinite(parsed) ? parsed : null;
}

// Map a JSONL record → the snake_case shape that ammpsNormalizer expects.
function jsonlToRaw(rec) {
  return {
    specialite: rec.name,
    dosage: rec.dosage ?? null,
    forme: rec.forme ?? null,
    presentation: rec.presentation ?? null,
    pp_gn: null,
    substance_active: rec.substance_active ?? null,
    classe_therapeutique: null,
    laboratoire: rec.epi ?? null,
    statut_amm: null,
    statut_commercialisation: rec.statut_commercialisation ?? null,
    ppv: parsePrice(rec.ppv),
    ph: parsePrice(rec.ph),
    pfht: null,
    tva: null,
    source_url: rec.rcp_url || 'jsonl:medicaments.jsonl',
  };
}

async function* readLines(filePath) {
  const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
  for await (const line of rl) {
    const t = line.trim();
    if (t) yield t;
  }
}

// Programmatic import — used by CLI and by the backend bootstrap auto-seed.
// Returns the finalized sync-run log row.
async function importMedicamentsFromJsonl({
  db,
  filePath = DEFAULT_PATH,
  triggeredBy = 'manual:cli:jsonl',
  logger = console,
} = {}) {
  if (!fs.existsSync(filePath)) {
    const err = new Error(`File not found: ${filePath}`);
    err.code = 'ENOENT';
    throw err;
  }
  logger.log(`[import] reading ${filePath}`);

  const log = await syncRepo.createRun(db, triggeredBy);
  const syncRunId = log.id;
  const syncedAt = new Date();

  const totals = {
    totalFetched: 0,
    totalCreated: 0,
    totalUpdated: 0,
    totalUnchanged: 0,
    totalFailed: 0,
  };

  try {
    let lineNo = 0;
    for await (const line of readLines(filePath)) {
      lineNo += 1;
      let rec;
      try {
        rec = JSON.parse(line);
      } catch (e) {
        totals.totalFailed += 1;
        logger.error(`[import] line ${lineNo}: bad JSON — ${e.message}`);
        continue;
      }
      if (!rec?.name) {
        totals.totalFailed += 1;
        continue;
      }

      let normalized;
      try {
        normalized = normalizer.normalize(jsonlToRaw(rec), { syncedAt });
      } catch (e) {
        totals.totalFailed += 1;
        logger.error(`[import] line ${lineNo}: normalize failed — ${e.message}`);
        continue;
      }

      totals.totalFetched += 1;

      try {
        const { action } = await catalogRepo.upsert(db, normalized, syncRunId);
        if (action === 'created') totals.totalCreated += 1;
        else if (action === 'updated') totals.totalUpdated += 1;
        else totals.totalUnchanged += 1;
      } catch (e) {
        totals.totalFailed += 1;
        logger.error(`[import] line ${lineNo}: upsert failed — ${e.message}`);
      }

      if (totals.totalFetched % 500 === 0) {
        logger.log(`[import] processed ${totals.totalFetched} rows…`);
      }
    }

    const status = totals.totalFailed > 0 ? 'partial' : 'success';
    return await syncRepo.finishRun(db, syncRunId, totals, status, null);
  } catch (e) {
    await syncRepo.finishRun(db, syncRunId, totals, 'failed', String(e.message || e));
    throw e;
  }
}

async function main() {
  const filePath = path.resolve(process.argv[2] || DEFAULT_PATH);
  const db = getPool();
  try {
    const finalLog = await importMedicamentsFromJsonl({ db, filePath });
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(finalLog, null, 2));
    process.exitCode = finalLog.status === 'failed' ? 1 : 0;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[import] fatal:', e);
    process.exitCode = 1;
  } finally {
    await closePool();
  }
}

module.exports = { importMedicamentsFromJsonl, DEFAULT_PATH };

if (require.main === module) {
  main();
}
