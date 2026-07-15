// Periodontal charts — pg. Two tables:
//   perio_charts    — one row per charting session (header)
//   perio_sites     — 6 rows per tooth (buccal/lingual × mesial/mid/distal)
//
// The chart and its sites are loaded together when reading a single chart
// (clients display a 6-site-per-tooth grid). When listing, sites are
// omitted — only the headers. Site upserts are "replace" semantics: a PUT
// to /perio/:id/sites blows away the existing sites for that chart and
// re-inserts the payload, atomically inside a transaction.

function chartFromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    clinicId: row.clinic_id,
    patientId: row.patient_id,
    chartedAt: row.charted_at,
    chartedBy: row.charted_by ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function siteFromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    perioChartId: row.perio_chart_id,
    clinicId: row.clinic_id,
    tooth: row.tooth,
    position: row.position,
    pocketDepthMm: row.pocket_depth_mm ?? undefined,
    recessionMm: row.recession_mm ?? undefined,
    bleedingOnProbing: row.bleeding_on_probing === true,
    suppuration: row.suppuration === true,
    mobility: row.mobility ?? undefined,
    furcation: row.furcation ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const CHART_COLS = {
  patientId: 'patient_id',
  chartedAt: 'charted_at',
  chartedBy: 'charted_by',
  notes: 'notes',
};

async function listCharts(db, { page = 0, pageSize = 50, patientId }) {
  const where = []; const params = [];
  if (patientId) { params.push(patientId); where.push(`patient_id = $${params.length}`); }
  const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';
  params.push(pageSize); const limitIdx = params.length;
  params.push(page * pageSize); const offsetIdx = params.length;
  const dataSQL = `SELECT * FROM perio_charts ${whereSQL}
                   ORDER BY charted_at DESC
                   LIMIT $${limitIdx} OFFSET $${offsetIdx}`;
  const countParams = params.slice(0, params.length - 2);
  const countSQL = `SELECT COUNT(*)::int AS count FROM perio_charts ${whereSQL}`;
  const [d, c] = await Promise.all([db.query(dataSQL, params), db.query(countSQL, countParams)]);
  return { data: d.rows.map(chartFromDb), page, pageSize, total: c.rows[0].count };
}

async function getChartWithSites(db, id) {
  const r = await db.query(`SELECT * FROM perio_charts WHERE id = $1`, [id]);
  const chart = chartFromDb(r.rows[0]);
  if (!chart) return null;
  const s = await db.query(
    `SELECT * FROM perio_sites WHERE perio_chart_id = $1 ORDER BY tooth, position`,
    [id],
  );
  return { ...chart, sites: s.rows.map(siteFromDb) };
}

async function createChart(db, input, clinicId) {
  const cols = ['clinic_id'];
  const vals = [clinicId];
  for (const [k, col] of Object.entries(CHART_COLS)) {
    if (input[k] !== undefined) {
      cols.push(col);
      vals.push(input[k] ?? null);
    }
  }
  const placeholders = vals.map((_, i) => `$${i + 1}`).join(', ');
  // The header insert and any initial site rows must be atomic.
  const client = await db.connect?.() ?? db;
  const owned = client !== db;
  try {
    if (owned) await client.query('BEGIN');
    const r = await client.query(
      `INSERT INTO perio_charts (${cols.join(', ')}) VALUES (${placeholders}) RETURNING *`,
      vals,
    );
    const chart = chartFromDb(r.rows[0]);
    if (Array.isArray(input.sites) && input.sites.length > 0) {
      await insertSites(client, chart.id, clinicId, input.sites);
    }
    if (owned) await client.query('COMMIT');
    return chart;
  } catch (err) {
    if (owned) await client.query('ROLLBACK');
    throw err;
  } finally {
    if (owned && client.release) client.release();
  }
}

async function updateChart(db, id, patch) {
  const sets = []; const params = [];
  for (const [k, col] of Object.entries(CHART_COLS)) {
    if (patch[k] !== undefined) {
      params.push(patch[k] ?? null);
      sets.push(`${col} = $${params.length}`);
    }
  }
  if (sets.length === 0) {
    const r = await db.query(`SELECT * FROM perio_charts WHERE id = $1`, [id]);
    return chartFromDb(r.rows[0]);
  }
  params.push(id);
  const r = await db.query(
    `UPDATE perio_charts SET ${sets.join(', ')}, updated_at = NOW()
      WHERE id = $${params.length} RETURNING *`,
    params,
  );
  return chartFromDb(r.rows[0]);
}

async function deleteChart(db, id) {
  await db.query(`DELETE FROM perio_charts WHERE id = $1`, [id]);
}

// Replace-semantics: drop the chart's existing sites and insert the payload.
// Inside a transaction so callers never see a half-empty chart.
async function replaceSites(db, chartId, clinicId, sites) {
  const client = await db.connect?.() ?? db;
  const owned = client !== db;
  try {
    if (owned) await client.query('BEGIN');
    await client.query(`DELETE FROM perio_sites WHERE perio_chart_id = $1`, [chartId]);
    if (Array.isArray(sites) && sites.length > 0) {
      await insertSites(client, chartId, clinicId, sites);
    }
    if (owned) await client.query('COMMIT');
    const r = await client.query(
      `SELECT * FROM perio_sites WHERE perio_chart_id = $1 ORDER BY tooth, position`,
      [chartId],
    );
    return r.rows.map(siteFromDb);
  } catch (err) {
    if (owned) await client.query('ROLLBACK');
    throw err;
  } finally {
    if (owned && client.release) client.release();
  }
}

async function insertSites(client, chartId, clinicId, sites) {
  const valuesSql = [];
  const params = [];
  for (const s of sites) {
    const row = [
      chartId,
      clinicId,
      s.tooth,
      s.position,
      s.pocketDepthMm ?? null,
      s.recessionMm ?? null,
      s.bleedingOnProbing === true,
      s.suppuration === true,
      s.mobility ?? null,
      s.furcation ?? null,
    ];
    const base = params.length;
    valuesSql.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10})`);
    params.push(...row);
  }
  await client.query(
    `INSERT INTO perio_sites
       (perio_chart_id, clinic_id, tooth, position, pocket_depth_mm, recession_mm,
        bleeding_on_probing, suppuration, mobility, furcation)
     VALUES ${valuesSql.join(', ')}`,
    params,
  );
}

module.exports = {
  listCharts,
  getChartWithSites,
  createChart,
  updateChart,
  deleteChart,
  replaceSites,
};
