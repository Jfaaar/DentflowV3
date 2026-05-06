const TABLE = 'quotes';

const num = (v) => (v == null ? 0 : typeof v === 'number' ? v : Number(v) || 0);

function mapStatus(s) {
  if (s === 'accepted') return 'accepted';
  if (s === 'rejected') return 'rejected';
  return 'draft';
}

function fromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    patientId: row.patient_id,
    treatments: [],
    total: num(row.total),
    date: row.created_at,
    status: mapStatus(row.status),
  };
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
  const row = {
    clinic_id: clinicId,
    patient_id: input.patientId,
    total: input.total,
    status: input.status === 'accepted' || input.status === 'rejected' ? input.status : 'draft',
  };
  const { data, error } = await supabase.from(TABLE).insert(row).select('*').single();
  if (error) throw error;
  return fromDb(data);
}

async function update(supabase, id, patch) {
  const row = {};
  if (patch.total !== undefined) row.total = patch.total;
  if (patch.status !== undefined) row.status = patch.status;
  const { data, error } = await supabase.from(TABLE).update(row).eq('id', id).select('*').single();
  if (error) throw error;
  return fromDb(data);
}

async function expire(supabase, id) {
  const { error } = await supabase.from(TABLE).update({ status: 'expired' }).eq('id', id);
  if (error) throw error;
}

module.exports = { list, get, create, update, expire };
