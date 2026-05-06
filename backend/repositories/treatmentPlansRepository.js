const TABLE = 'treatment_plans';

const numOrUndef = (v) => (v == null ? undefined : typeof v === 'number' ? v : Number(v));

function fromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    clinicId: row.clinic_id,
    patientId: row.patient_id,
    doctorId: row.doctor_id ?? undefined,
    title: row.title ?? undefined,
    status: row.status,
    estimatedTotal: numOrUndef(row.estimated_total),
    discount: numOrUndef(row.discount),
    insuranceCovered: numOrUndef(row.insurance_covered),
    patientResponsibility: numOrUndef(row.patient_responsibility),
    acceptedAt: row.accepted_at ?? undefined,
  };
}

function toDb(p) {
  const row = {};
  if (p.patientId !== undefined) row.patient_id = p.patientId;
  if (p.doctorId !== undefined) row.doctor_id = p.doctorId ?? null;
  if (p.title !== undefined) row.title = p.title ?? null;
  if (p.status !== undefined) row.status = p.status;
  if (p.estimatedTotal !== undefined) row.estimated_total = p.estimatedTotal;
  if (p.discount !== undefined) row.discount = p.discount;
  if (p.insuranceCovered !== undefined) row.insurance_covered = p.insuranceCovered;
  if (p.patientResponsibility !== undefined) row.patient_responsibility = p.patientResponsibility;
  if (p.acceptedAt !== undefined) row.accepted_at = p.acceptedAt ?? null;
  return row;
}

async function list(supabase, { page = 0, pageSize = 50, patientId, status }) {
  const from = page * pageSize;
  const to = from + pageSize - 1;
  let q = supabase
    .from(TABLE)
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);
  if (patientId) q = q.eq('patient_id', patientId);
  if (status) q = q.eq('status', status);
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
    .insert({ ...toDb(input), clinic_id: clinicId })
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

async function cancel(supabase, id) {
  const { error } = await supabase.from(TABLE).update({ status: 'canceled' }).eq('id', id);
  if (error) throw error;
}

module.exports = { list, get, create, update, cancel };
