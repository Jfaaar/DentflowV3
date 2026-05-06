const TABLE = 'clinical_notes';

function fromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    clinicId: row.clinic_id,
    patientId: row.patient_id,
    doctorId: row.doctor_id,
    appointmentId: row.appointment_id ?? undefined,
    consultationReason: row.consultation_reason ?? undefined,
    symptoms: row.symptoms ?? undefined,
    diagnosis: row.diagnosis ?? undefined,
    notes: row.notes ?? undefined,
    treatmentPlan: row.treatment_plan ?? undefined,
    followUp: row.follow_up ?? undefined,
    vitals: row.vitals ?? undefined,
    signedAt: row.signed_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toDb(n) {
  const row = {};
  if (n.patientId !== undefined) row.patient_id = n.patientId;
  if (n.doctorId !== undefined) row.doctor_id = n.doctorId;
  if (n.appointmentId !== undefined) row.appointment_id = n.appointmentId ?? null;
  if (n.consultationReason !== undefined) row.consultation_reason = n.consultationReason ?? null;
  if (n.symptoms !== undefined) row.symptoms = n.symptoms ?? null;
  if (n.diagnosis !== undefined) row.diagnosis = n.diagnosis ?? null;
  if (n.notes !== undefined) row.notes = n.notes ?? null;
  if (n.treatmentPlan !== undefined) row.treatment_plan = n.treatmentPlan ?? null;
  if (n.followUp !== undefined) row.follow_up = n.followUp ?? null;
  if (n.vitals !== undefined) row.vitals = n.vitals ?? null;
  if (n.signedAt !== undefined) row.signed_at = n.signedAt ?? null;
  return row;
}

async function list(supabase, { page = 0, pageSize = 50, patientId }) {
  const from = page * pageSize;
  const to = from + pageSize - 1;
  let q = supabase
    .from(TABLE)
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
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

async function remove(supabase, id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
}

module.exports = { list, get, create, update, remove };
