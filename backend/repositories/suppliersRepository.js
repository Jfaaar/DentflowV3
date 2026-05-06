const TABLE = 'suppliers';

function fromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    contactPerson: row.contact_person ?? undefined,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    address: row.address ?? undefined,
  };
}

function toDb(s) {
  const row = {};
  if (s.name !== undefined) row.name = s.name;
  if (s.contactPerson !== undefined) row.contact_person = s.contactPerson ?? null;
  if (s.phone !== undefined) row.phone = s.phone ?? null;
  if (s.email !== undefined) row.email = s.email ?? null;
  if (s.address !== undefined) row.address = s.address ?? null;
  return row;
}

async function list(supabase, { page = 0, pageSize = 200, search }) {
  const from = page * pageSize;
  const to = from + pageSize - 1;
  let q = supabase
    .from(TABLE)
    .select('*', { count: 'exact' })
    .order('name', { ascending: true })
    .range(from, to);
  if (search?.trim()) q = q.ilike('name', `%${search.trim()}%`);
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
