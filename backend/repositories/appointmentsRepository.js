const TABLE = 'appointments';
const SELECT_WITH_PATIENT = '*, patient:patients(full_name)';

function fromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    patientId: row.patient_id,
    patientName: row.patient?.full_name ?? '',
    start: row.starts_at,
    end: row.ends_at,
    status: row.status,
    observation: row.observation ?? undefined,
    createdAt: row.created_at,
  };
}

function toDb(a) {
  const row = {};
  if (a.patientId !== undefined) row.patient_id = a.patientId;
  if (a.start !== undefined) row.starts_at = a.start;
  if (a.end !== undefined) row.ends_at = a.end;
  if (a.status !== undefined) row.status = a.status;
  if (a.observation !== undefined) row.observation = a.observation || null;
  return row;
}

async function list(supabase, { page = 0, pageSize = 200, patientId, status, from, to }) {
  const fromIdx = page * pageSize;
  const toIdx = fromIdx + pageSize - 1;

  let q = supabase
    .from(TABLE)
    .select(SELECT_WITH_PATIENT, { count: 'exact' })
    .order('starts_at', { ascending: true })
    .range(fromIdx, toIdx);

  if (patientId) q = q.eq('patient_id', patientId);
  if (status) q = q.eq('status', status);
  if (from) q = q.gte('starts_at', from);
  if (to) q = q.lte('starts_at', to);

  const { data, error, count } = await q;
  if (error) throw error;
  return {
    data: (data ?? []).map(fromDb),
    page,
    pageSize,
    total: count ?? 0,
  };
}

async function get(supabase, id) {
  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_WITH_PATIENT)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return fromDb(data);
}

async function create(supabase, input, clinicId) {
  const row = { ...toDb(input), clinic_id: clinicId };
  const { data, error } = await supabase
    .from(TABLE)
    .insert(row)
    .select(SELECT_WITH_PATIENT)
    .single();
  if (error) throw error;
  return fromDb(data);
}

async function update(supabase, id, patch) {
  const { data, error } = await supabase
    .from(TABLE)
    .update(toDb(patch))
    .eq('id', id)
    .select(SELECT_WITH_PATIENT)
    .single();
  if (error) throw error;
  return fromDb(data);
}

async function cancel(supabase, id, reason) {
  const { error } = await supabase
    .from(TABLE)
    .update({ status: 'canceled', cancellation_reason: reason ?? null })
    .eq('id', id);
  if (error) throw error;
}

async function cancelMany(supabase, ids) {
  if (!ids.length) return;
  const { error } = await supabase.from(TABLE).update({ status: 'canceled' }).in('id', ids);
  if (error) throw error;
}

module.exports = { list, get, create, update, cancel, cancelMany };
