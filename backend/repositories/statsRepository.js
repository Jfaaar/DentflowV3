// Dashboard / clinic-level aggregates — pg. Each COUNT/SUM is a single
// roundtrip; getDashboardStats parallelizes 4 of them.

async function getDashboardStats(db) {
  const [activePatients, totalAppointments, totalInvoices, totalTreatments] =
    await Promise.all([
      db.query(`SELECT COUNT(*)::int AS count FROM patients WHERE status = 'active'`),
      db.query(`SELECT COUNT(*)::int AS count FROM appointments`),
      db.query(`SELECT COUNT(*)::int AS count FROM invoices`),
      db.query(`SELECT COUNT(*)::int AS count FROM treatments`),
    ]);

  return {
    activePatients: activePatients.rows[0].count,
    totalAppointments: totalAppointments.rows[0].count,
    totalInvoices: totalInvoices.rows[0].count,
    totalTreatments: totalTreatments.rows[0].count,
  };
}

async function getRevenueSummary(db) {
  const r = await db.query(
    `SELECT COALESCE(SUM(amount), 0)::float AS total_billed,
            COALESCE(SUM(paid_amount), 0)::float AS total_collected
     FROM invoices`,
  );
  const totalBilled = r.rows[0].total_billed;
  const totalCollected = r.rows[0].total_collected;
  return {
    totalBilled,
    totalCollected,
    outstanding: totalBilled - totalCollected,
  };
}

module.exports = { getDashboardStats, getRevenueSummary };
