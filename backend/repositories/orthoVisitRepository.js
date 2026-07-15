// Orthodontic visits — pg. Hung off ortho_episodes via FK.
// Surfaced two ways:
//   list(db, { episodeId })       — visits of one episode, newest first
//   get(db, id)                   — one visit by id
//   create(db, episodeId, input, clinicId)
//   update(db, id, patch)
//   remove(db, id)

function fromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    orthoEpisodeId: row.ortho_episode_id,
    clinicId: row.clinic_id,
    visitDate: row.visit_date,
    changes: row.changes ?? undefined,
    adjustments: row.adjustments ?? undefined,
    photoFileIds: row.photo_file_ids ?? [],
    performedBy: row.performed_by ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const COLS = {
  visitDate: 'visit_date',
  changes: 'changes',
  adjustments: 'adjustments',
  photoFileIds: 'photo_file_ids',
  performedBy: 'performed_by',
  notes: 'notes',
};

async function list(db, { episodeId, page = 0, pageSize = 100 }) {
  const params = [episodeId, pageSize, page * pageSize];
  const r = await db.query(
    `SELECT * FROM ortho_visits
      WHERE ortho_episode_id = $1
      ORDER BY visit_date DESC, created_at DESC
      LIMIT $2 OFFSET $3`,
    params,
  );
  const c = await db.query(
    `SELECT COUNT(*)::int AS count FROM ortho_visits WHERE ortho_episode_id = $1`,
    [episodeId],
  );
  return { data: r.rows.map(fromDb), page, pageSize, total: c.rows[0].count };
}

async function get(db, id) {
  const r = await db.query(`SELECT * FROM ortho_visits WHERE id = $1`, [id]);
  return fromDb(r.rows[0]);
}

async function create(db, episodeId, input, clinicId) {
  const cols = ['ortho_episode_id', 'clinic_id'];
  const vals = [episodeId, clinicId];
  for (const [k, col] of Object.entries(COLS)) {
    if (input[k] !== undefined) {
      cols.push(col);
      vals.push(input[k] ?? null);
    }
  }
  const placeholders = vals.map((_, i) => `$${i + 1}`).join(', ');
  const r = await db.query(
    `INSERT INTO ortho_visits (${cols.join(', ')}) VALUES (${placeholders}) RETURNING *`,
    vals,
  );
  return fromDb(r.rows[0]);
}

async function update(db, id, patch) {
  const sets = []; const params = [];
  for (const [k, col] of Object.entries(COLS)) {
    if (patch[k] !== undefined) {
      params.push(patch[k] ?? null);
      sets.push(`${col} = $${params.length}`);
    }
  }
  if (sets.length === 0) return get(db, id);
  params.push(id);
  const r = await db.query(
    `UPDATE ortho_visits SET ${sets.join(', ')}, updated_at = NOW()
      WHERE id = $${params.length} RETURNING *`,
    params,
  );
  return fromDb(r.rows[0]);
}

async function remove(db, id) {
  await db.query(`DELETE FROM ortho_visits WHERE id = $1`, [id]);
}

module.exports = { list, get, create, update, remove };
