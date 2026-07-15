// AMMPS sync logs + staging — pg.

function logFromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    startedAt: row.started_at,
    finishedAt: row.finished_at ?? null,
    status: row.status,
    totalFetched: row.total_fetched,
    totalCreated: row.total_created,
    totalUpdated: row.total_updated,
    totalUnchanged: row.total_unchanged,
    totalFailed: row.total_failed,
    errorMessage: row.error_message ?? null,
    triggeredBy: row.triggered_by,
    createdAt: row.created_at,
  };
}

async function createRun(db, triggeredBy) {
  const r = await db.query(
    `INSERT INTO medicament_sync_logs (triggered_by) VALUES ($1) RETURNING *`,
    [triggeredBy],
  );
  return logFromDb(r.rows[0]);
}

async function finishRun(db, id, totals, status, errorMessage) {
  const r = await db.query(
    `UPDATE medicament_sync_logs
       SET finished_at   = NOW(),
           status        = $1,
           total_fetched = $2,
           total_created = $3,
           total_updated = $4,
           total_unchanged = $5,
           total_failed  = $6,
           error_message = $7
     WHERE id = $8
     RETURNING *`,
    [
      status,
      totals.totalFetched ?? 0,
      totals.totalCreated ?? 0,
      totals.totalUpdated ?? 0,
      totals.totalUnchanged ?? 0,
      totals.totalFailed ?? 0,
      errorMessage ?? null,
      id,
    ],
  );
  return logFromDb(r.rows[0]);
}

async function getLast(db) {
  const r = await db.query(
    `SELECT * FROM medicament_sync_logs ORDER BY started_at DESC LIMIT 1`,
  );
  return logFromDb(r.rows[0]);
}

// Returns true if any sync run is currently in 'running' state, started in
// the last `windowMinutes` minutes — used as a concurrency guard.
async function hasRunning(db, windowMinutes = 60) {
  const r = await db.query(
    `SELECT 1 FROM medicament_sync_logs
       WHERE status = 'running'
         AND started_at > NOW() - ($1 || ' minutes')::interval
       LIMIT 1`,
    [String(windowMinutes)],
  );
  return r.rowCount > 0;
}

// Bulk insert raw rows from the parser. `rows` is an array of
// { raw, sourceHash, normalized, parseError }.
async function insertStaging(db, syncRunId, rows) {
  if (!rows.length) return;
  const placeholders = [];
  const values = [];
  let p = 1;
  for (const r of rows) {
    values.push(
      syncRunId,
      JSON.stringify(r.raw ?? {}),
      r.sourceHash ?? null,
      r.normalized ? JSON.stringify(r.normalized) : null,
      r.parseError ?? null,
    );
    placeholders.push(`($${p++}, $${p++}::jsonb, $${p++}, $${p++}::jsonb, $${p++})`);
  }
  await db.query(
    `INSERT INTO medicaments_staging
       (sync_run_id, raw, source_hash, normalized, parse_error)
     VALUES ${placeholders.join(', ')}`,
    values,
  );
}

// Keep only the last `keepRuns` worth of staging data. Called at the end of
// a successful run to bound storage.
async function pruneStaging(db, keepRuns = 5) {
  await db.query(
    `DELETE FROM medicaments_staging
       WHERE sync_run_id NOT IN (
         SELECT id FROM medicament_sync_logs
         ORDER BY started_at DESC
         LIMIT $1
       )`,
    [keepRuns],
  );
}

module.exports = {
  createRun,
  finishRun,
  getLast,
  hasRunning,
  insertStaging,
  pruneStaging,
};
