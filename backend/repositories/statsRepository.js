// Dashboard / clinic-level aggregates. Each query is RLS-scoped to the
// authenticated user's clinic via req.supabase.

async function countTable(supabase, table, filters = {}) {
  let q = supabase.from(table).select('*', { count: 'exact', head: true });
  for (const [col, val] of Object.entries(filters)) {
    q = q.eq(col, val);
  }
  const { count, error } = await q;
  if (error) throw error;
  return count ?? 0;
}

async function getDashboardStats(supabase) {
  const [patients, appointments, invoices, treatments] = await Promise.all([
    countTable(supabase, 'patients', { status: 'active' }),
    countTable(supabase, 'appointments'),
    countTable(supabase, 'invoices'),
    countTable(supabase, 'treatments'),
  ]);

  return {
    activePatients: patients,
    totalAppointments: appointments,
    totalInvoices: invoices,
    totalTreatments: treatments,
  };
}

async function getRevenueSummary(supabase) {
  const { data: invoices, error: invErr } = await supabase
    .from('invoices')
    .select('amount, paid_amount, status');
  if (invErr) throw invErr;

  const num = (v) => (v == null ? 0 : typeof v === 'number' ? v : Number(v) || 0);
  const totalBilled = (invoices ?? []).reduce((s, i) => s + num(i.amount), 0);
  const totalCollected = (invoices ?? []).reduce((s, i) => s + num(i.paid_amount), 0);
  const outstanding = totalBilled - totalCollected;
  return { totalBilled, totalCollected, outstanding };
}

module.exports = { getDashboardStats, getRevenueSummary };
