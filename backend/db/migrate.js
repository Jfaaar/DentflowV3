// Migration runner — invoked from index.js on backend startup.
//
// Dev behavior (NODE_ENV !== 'production'):
//   1. DESTRUCTIVE RESET — every user schema is dropped, public is
//      recreated, and the bookkeeping table is wiped. The DB starts
//      from zero on every backend boot.
//   2. All migration files (init stubs + numbered migrations) are
//      applied fresh, in order, each inside its own transaction.
//   3. Dev seeds are re-applied.
//
// Production behavior (NODE_ENV === 'production'):
//   • Reset is REFUSED. Only pending migrations are applied, dev seeds
//     are skipped.
//
// Order:
//   init/00_local_stubs.sql   -> tracked
//   migrations/*.sql (sorted) -> tracked
//   init/99*.sql              -> untracked, dev-only
//
// Toggles:
//   SKIP_MIGRATIONS=true        skip the migration phase entirely
//   SKIP_DB_RESET=true          skip the destructive reset (keep data, run pending only)
//   SKIP_DEV_SEED=true          skip dev seeds
//   SKIP_MEDICAMENTS_SEED=true  skip the medicaments_catalog auto-import

const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');
const INIT_DIR = path.join(__dirname, 'init');
const STUBS_FILE = '00_local_stubs.sql';

async function ensureBookkeepingTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function listApplied(client) {
  const r = await client.query('SELECT filename FROM schema_migrations');
  return new Set(r.rows.map(row => row.filename));
}

async function coreSchemaExists(client) {
  const r = await client.query(`
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'clinics'
    LIMIT 1
  `);
  return r.rowCount > 0;
}

function listMigrationFiles() {
  // Tracked order: stubs first, then numbered migrations alphabetically.
  const files = [{ dir: INIT_DIR, name: STUBS_FILE }];
  const migrations = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();
  for (const name of migrations) {
    files.push({ dir: MIGRATIONS_DIR, name });
  }
  return files;
}

function listDevSeedFiles() {
  return fs
    .readdirSync(INIT_DIR)
    .filter(f => f.startsWith('99') && f.endsWith('.sql'))
    .sort()
    .map(name => ({ dir: INIT_DIR, name }));
}

async function applyFile(client, file) {
  const sql = fs.readFileSync(path.join(file.dir, file.name), 'utf8');
  await client.query(sql);
}

async function runMigrations(pool) {
  if (process.env.SKIP_MIGRATIONS === 'true') {
    console.log('[migrate] SKIP_MIGRATIONS=true, skipping');
    return;
  }

  const client = await pool.connect();
  try {
    await ensureBookkeepingTable(client);
    const applied = await listApplied(client);
    const allFiles = listMigrationFiles();

    // Baseline: a brand-new bookkeeping table on top of an already-built
    // schema means docker-entrypoint-initdb.d ran the SQL already. Record
    // everything so we never re-execute the historical migrations.
    if (applied.size === 0 && (await coreSchemaExists(client))) {
      console.log('[migrate] existing schema detected, baselining migrations as applied');
      for (const file of allFiles) {
        await client.query(
          'INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING',
          [file.name],
        );
      }
      return;
    }

    const pending = allFiles.filter(f => !applied.has(f.name));
    if (pending.length === 0) {
      console.log('[migrate] up to date');
      return;
    }

    for (const file of pending) {
      console.log(`[migrate] applying ${file.name}`);
      await client.query('BEGIN');
      try {
        await applyFile(client, file);
        await client.query(
          'INSERT INTO schema_migrations (filename) VALUES ($1)',
          [file.name],
        );
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`[migrate] failed on ${file.name}: ${err.message}`);
      }
    }
    console.log(`[migrate] applied ${pending.length} migration(s)`);
  } finally {
    client.release();
  }
}

async function runDevSeeds(pool) {
  if (process.env.NODE_ENV === 'production') return;
  if (process.env.SKIP_DEV_SEED === 'true') {
    console.log('[migrate] SKIP_DEV_SEED=true, skipping dev seeds');
    return;
  }
  const seeds = listDevSeedFiles();
  if (seeds.length === 0) return;

  const client = await pool.connect();
  try {
    for (const file of seeds) {
      console.log(`[migrate] running dev seed ${file.name}`);
      await applyFile(client, file);
    }
  } finally {
    client.release();
  }
}

async function resetDatabase(pool) {
  if (process.env.NODE_ENV === 'production') {
    console.log('[migrate] production detected, refusing destructive reset');
    return;
  }
  if (process.env.SKIP_DB_RESET === 'true') {
    console.log('[migrate] SKIP_DB_RESET=true, skipping reset');
    return;
  }
  console.log('[migrate] DESTRUCTIVE RESET — dropping all user schemas');
  const client = await pool.connect();
  try {
    await client.query(`
      DO $$
      DECLARE s TEXT;
      BEGIN
        FOR s IN
          SELECT nspname FROM pg_namespace
          WHERE nspname NOT IN ('pg_catalog','information_schema','pg_toast')
            AND nspname NOT LIKE 'pg_temp_%'
            AND nspname NOT LIKE 'pg_toast_temp_%'
        LOOP
          EXECUTE format('DROP SCHEMA IF EXISTS %I CASCADE', s);
        END LOOP;
      END $$;
    `);
    await client.query('CREATE SCHEMA public');
    await client.query('GRANT ALL ON SCHEMA public TO CURRENT_USER');
    await client.query('GRANT ALL ON SCHEMA public TO public');
  } finally {
    client.release();
  }
}

// Auto-seed the medicaments_catalog from the bundled JSONL dump. Skipped when
// the table already has rows (idempotent on warm restarts) or when the file
// is missing. Set SKIP_MEDICAMENTS_SEED=true to disable entirely.
async function seedMedicamentsCatalog(pool) {
  if (process.env.SKIP_MEDICAMENTS_SEED === 'true') {
    console.log('[migrate] SKIP_MEDICAMENTS_SEED=true, skipping medicaments seed');
    return;
  }

  const existing = await pool.query('SELECT COUNT(*)::int AS n FROM medicaments_catalog');
  const count = existing.rows[0]?.n ?? 0;
  if (count > 0) {
    console.log(`[migrate] medicaments_catalog already populated (${count} rows), skipping seed`);
    return;
  }

  const { importMedicamentsFromJsonl, DEFAULT_PATH } = require('../scripts/importMedicamentsFromJsonl');
  if (!fs.existsSync(DEFAULT_PATH)) {
    console.log(`[migrate] medicaments JSONL not found at ${DEFAULT_PATH}, skipping seed`);
    return;
  }

  console.log('[migrate] seeding medicaments_catalog from JSONL');
  const result = await importMedicamentsFromJsonl({ db: pool, triggeredBy: 'auto:bootstrap' });
  console.log(
    `[migrate] medicaments seed ${result.status} — created ${result.totalCreated}, ` +
    `updated ${result.totalUpdated}, unchanged ${result.totalUnchanged}, failed ${result.totalFailed}`
  );
}

async function bootstrap(pool) {
  await resetDatabase(pool);
  await runMigrations(pool);
  await runDevSeeds(pool);
  await seedMedicamentsCatalog(pool);
}

module.exports = { bootstrap, resetDatabase, runMigrations, runDevSeeds, seedMedicamentsCatalog };
