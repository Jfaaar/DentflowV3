const TABLE = 'prescriptions';
const SELECT = '*, items:prescription_items(*)';

function itemFromDb(row) {
  return {
    medicamentId: row.inventory_item_id ?? '',
    medicamentName: row.medication_name,
    dosage: row.dosage ?? '',
    frequency: row.frequency ?? '',
    duration: row.duration ?? '',
    note: row.notes ?? undefined,
  };
}

function fromDb(row, items = []) {
  if (!row) return null;
  return {
    id: row.id,
    patientId: row.patient_id,
    date: row.created_at,
    items: items.map(itemFromDb),
    notes: row.notes ?? undefined,
  };
}

async function list(supabase, { page = 0, pageSize = 50, patientId }) {
  const from = page * pageSize;
  const to = from + pageSize - 1;
  let q = supabase
    .from(TABLE)
    .select(SELECT, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);
  if (patientId) q = q.eq('patient_id', patientId);
  const { data, error, count } = await q;
  if (error) throw error;
  return {
    data: (data ?? []).map((r) => fromDb(r, r.items ?? [])),
    page,
    pageSize,
    total: count ?? 0,
  };
}

async function get(supabase, id) {
  const { data, error } = await supabase.from(TABLE).select(SELECT).eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return fromDb(data, data.items ?? []);
}

async function create(supabase, input, clinicId) {
  const { data: head, error: headErr } = await supabase
    .from(TABLE)
    .insert({
      clinic_id: clinicId,
      patient_id: input.patientId,
      notes: input.notes ?? null,
    })
    .select('*')
    .single();
  if (headErr) throw headErr;

  const id = head.id;

  if (Array.isArray(input.items) && input.items.length > 0) {
    const itemRows = input.items.map((it) => ({
      clinic_id: clinicId,
      prescription_id: id,
      inventory_item_id: it.medicamentId || null,
      medication_name: it.medicamentName,
      dosage: it.dosage || null,
      frequency: it.frequency || null,
      duration: it.duration || null,
      notes: it.note ?? null,
    }));
    const { error: itemErr } = await supabase.from('prescription_items').insert(itemRows);
    if (itemErr) throw itemErr;

    const txRows = input.items
      .filter((it) => it.medicamentId)
      .map((it) => ({
        clinic_id: clinicId,
        item_id: it.medicamentId,
        type: 'usage',
        quantity: -1,
        reason: 'Prescription',
        reference_id: id,
      }));
    if (txRows.length > 0) {
      await supabase.from('inventory_transactions').insert(txRows);
    }
  }

  return get(supabase, id);
}

async function update(supabase, id, patch) {
  const row = {};
  if (patch.notes !== undefined) row.notes = patch.notes ?? null;
  const { error } = await supabase.from(TABLE).update(row).eq('id', id);
  if (error) throw error;
  return get(supabase, id);
}

async function remove(supabase, id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
}

module.exports = { list, get, create, update, remove };
