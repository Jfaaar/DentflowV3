const TABLE = 'treatments';

const num = (v) => (v == null ? 0 : typeof v === 'number' ? v : Number(v) || 0);

function fromDb(row, materials) {
  if (!row) return null;
  return {
    id: row.id,
    patientId: row.patient_id,
    date: row.performed_at ?? row.created_at,
    tooth: row.tooth ?? undefined,
    surface: row.surface ?? undefined,
    description: row.description,
    price: num(row.price),
    status: row.status === 'completed' ? 'completed' : 'planned',
    materialsUsed: materials,
  };
}

async function list(supabase, { page = 0, pageSize = 200, patientId }) {
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
  return { data: (data ?? []).map((r) => fromDb(r)), page, pageSize, total: count ?? 0 };
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
    tooth: input.tooth ?? null,
    surface: input.surface ?? null,
    description: input.description,
    price: input.price,
    status: input.status,
    performed_at:
      input.status === 'completed' ? input.date ?? new Date().toISOString() : null,
  };
  const { data, error } = await supabase.from(TABLE).insert(row).select('*').single();
  if (error) throw error;

  const created = fromDb(data, input.materialsUsed);

  if (
    input.status === 'completed' &&
    Array.isArray(input.materialsUsed) &&
    input.materialsUsed.length > 0
  ) {
    const txRows = input.materialsUsed.map((m) => ({
      clinic_id: clinicId,
      item_id: m.itemId,
      type: 'usage',
      quantity: -Math.abs(m.quantity),
      reason: `Clinical Use: ${input.description}`,
      reference_id: created.id,
    }));
    await supabase.from('inventory_transactions').insert(txRows);
  }

  return created;
}

async function update(supabase, id, patch) {
  const row = {};
  if (patch.tooth !== undefined) row.tooth = patch.tooth ?? null;
  if (patch.surface !== undefined) row.surface = patch.surface ?? null;
  if (patch.description !== undefined) row.description = patch.description;
  if (patch.price !== undefined) row.price = patch.price;
  if (patch.status !== undefined) {
    row.status = patch.status;
    row.performed_at =
      patch.status === 'completed' ? patch.date ?? new Date().toISOString() : null;
  }
  const { data, error } = await supabase.from(TABLE).update(row).eq('id', id).select('*').single();
  if (error) throw error;
  return fromDb(data);
}

async function cancel(supabase, id) {
  const { error } = await supabase.from(TABLE).update({ status: 'canceled' }).eq('id', id);
  if (error) throw error;
}

module.exports = { list, get, create, update, cancel };
