// Patients data access. Only this file (and the rest of repositories/) speaks
// directly to Supabase tables. Services should never import the Supabase client.
//
// Column convention: snake_case in DB, camelCase in DTO. The mapping is
// hand-rolled per repository — unfamiliar fields are an explicit choice.

const TABLE = 'patients';

function fromDb(row, mh) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.full_name,
    phone: row.phone ?? '',
    email: row.email ?? undefined,
    profilePicture: row.profile_picture ?? undefined,
    address: row.address ?? undefined,
    birthDate: row.birth_date ?? undefined,
    gender:
      row.gender === 'male' || row.gender === 'female' ? row.gender : undefined,
    insuranceProvider: row.insurance_provider ?? undefined,
    status: row.status === 'active' || row.status === 'archived' ? row.status : 'active',
    createdAt: row.created_at,
    medicalHistory: mh
      ? {
          allergies: mh.allergies ?? [],
          conditions: mh.conditions ?? [],
          medications: mh.medications ?? [],
          notes: mh.notes ?? undefined,
        }
      : undefined,
  };
}

function toDb(p, clinicId) {
  const row = {};
  if (p.name !== undefined) row.full_name = p.name;
  if (p.phone !== undefined) row.phone = p.phone || null;
  if (p.email !== undefined) row.email = p.email || null;
  if (p.profilePicture !== undefined) row.profile_picture = p.profilePicture || null;
  if (p.address !== undefined) row.address = p.address || null;
  if (p.birthDate !== undefined) row.birth_date = p.birthDate || null;
  if (p.gender !== undefined) row.gender = p.gender || null;
  if (p.insuranceProvider !== undefined) row.insurance_provider = p.insuranceProvider || null;
  if (p.status !== undefined) {
    row.status = p.status;
    row.archived_at = p.status === 'archived' ? new Date().toISOString() : null;
  }
  if (clinicId) row.clinic_id = clinicId;
  return row;
}

async function list(supabase, { page = 0, pageSize = 50, search, status }) {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  let q = supabase
    .from(TABLE)
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (status) q = q.eq('status', status);

  if (search && search.trim()) {
    const term = search.trim().replace(/[,()]/g, '');
    q = q.or(
      `full_name.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%`
    );
  }

  const { data, error, count } = await q;
  if (error) throw error;
  return {
    data: (data ?? []).map((r) => fromDb(r)),
    page,
    pageSize,
    total: count ?? 0,
  };
}

async function get(supabase, id) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const { data: mh } = await supabase
    .from('patient_medical_history')
    .select('*')
    .eq('patient_id', id)
    .maybeSingle();

  return fromDb(data, mh);
}

async function create(supabase, input, clinicId) {
  const row = toDb({ status: 'active', ...input }, clinicId);
  const { data, error } = await supabase
    .from(TABLE)
    .insert(row)
    .select('*')
    .single();
  if (error) throw error;
  return fromDb(data);
}

async function update(supabase, id, patch) {
  const row = toDb(patch, '');
  delete row.clinic_id;
  const { data, error } = await supabase
    .from(TABLE)
    .update(row)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return fromDb(data);
}

async function archive(supabase, id) {
  const { error } = await supabase
    .from(TABLE)
    .update({ status: 'archived', archived_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

async function remove(supabase, id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
}

module.exports = { list, get, create, update, archive, remove };
