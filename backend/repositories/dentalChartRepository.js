const TABLE = 'dental_chart_entries';

function fromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    clinicId: row.clinic_id,
    patientId: row.patient_id,
    tooth: row.tooth,
    surface: row.surface ?? undefined,
    finding: row.finding,
    notes: row.notes ?? undefined,
    recordedAt: row.recorded_at,
    recordedBy: row.recorded_by ?? undefined,
  };
}

function toDb(e) {
  const row = {};
  if (e.patientId !== undefined) row.patient_id = e.patientId;
  if (e.tooth !== undefined) row.tooth = e.tooth;
  if (e.surface !== undefined) row.surface = e.surface ?? null;
  if (e.finding !== undefined) row.finding = e.finding;
  if (e.notes !== undefined) row.notes = e.notes ?? null;
  if (e.recordedAt !== undefined) row.recorded_at = e.recordedAt;
  if (e.recordedBy !== undefined) row.recorded_by = e.recordedBy ?? null;
  return row;
}

async function list(supabase, { page = 0, pageSize = 200, patientId }) {
  const from = page * pageSize;
  const to = from + pageSize - 1;
  let q = supabase
    .from(TABLE)
    .select('*', { count: 'exact' })
    .order('recorded_at', { ascending: false })
    .range(from, to);
  if (patientId) q = q.eq('patient_id', patientId);
  const { data, error, count } = await q;
  if (error) throw error;
  return { data: (data ?? []).map(fromDb), page, pageSize, total: count ?? 0 };
}

async function get(supabase, id) {
  const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return fromDb(data);
}

async function create(supabase, input, clinicId) {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      ...toDb(input),
      clinic_id: clinicId,
      recorded_at: input.recordedAt ?? new Date().toISOString(),
    })
    .select('*')
    .single();
  if (error) throw error;
  return fromDb(data);
}

async function update(supabase, id, patch) {
  const { data, error } = await supabase
    .from(TABLE)
    .update(toDb(patch))
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return fromDb(data);
}

async function remove(supabase, id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
}

module.exports = { list, get, create, update, remove };
