// node-postgres pool, configured from env. Repositories accept a Pool
// (or a Pool-compatible client) as their first argument; the auth
// middleware attaches `req.db` per request.
//
// Configuration order:
//   1. DATABASE_URL                    (preferred — single connection string)
//   2. PG{HOST,PORT,USER,PASSWORD,DATABASE}
//   3. compose defaults (host=localhost, port=5432, user/db=dentflow)

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', 'frontend', '.env.local') });

const { Pool } = require('pg');

function buildConfig() {
  if (process.env.DATABASE_URL) {
    return { connectionString: process.env.DATABASE_URL };
  }
  return {
    host: process.env.PGHOST || 'localhost',
    port: Number(process.env.PGPORT || 5432),
    user: process.env.PGUSER || 'dentflow',
    password: process.env.PGPASSWORD || 'dentflow',
    database: process.env.PGDATABASE || 'dentflow',
    max: Number(process.env.PG_POOL_MAX || 10),
    idleTimeoutMillis: 30_000,
  };
}

let pool = null;
function getPool() {
  if (pool) return pool;
  pool = new Pool(buildConfig());
  pool.on('error', (err) => {
    // eslint-disable-next-line no-console
    console.error('[pg] idle client error:', err);
  });
  return pool;
}

// For tests / explicit shutdown.
async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = { getPool, closePool };
