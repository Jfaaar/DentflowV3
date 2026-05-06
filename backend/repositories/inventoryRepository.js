const TABLE = 'inventory_items';
const SELECT = '*, supplier:suppliers(name)';

const num = (v) => (v == null ? 0 : typeof v === 'number' ? v : Number(v) || 0);
const numOrUndef = (v) => (v == null ? undefined : typeof v === 'number' ? v : Number(v));

function fromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    category: row.category ?? undefined,
    stock: num(row.stock),
    minStock: num(row.min_stock),
    supplier: row.supplier?.name ?? undefined,
    price: numOrUndef(row.cost_price),
    form: row.unit ?? undefined,
    expiryDate: row.expiry_date ?? undefined,
    brand: row.brand ?? undefined,
    serialNumber: row.serial_number ?? undefined,
    lastMaintenance: row.last_maintenance ?? undefined,
    location: row.location ?? undefined,
  };
}

function toDb(i) {
  const row = {};
  if (i.name !== undefined) row.name = i.name;
  if (i.type !== undefined) row.type = i.type;
  if (i.category !== undefined) row.category = i.category ?? null;
  if (i.stock !== undefined) row.stock = i.stock;
  if (i.minStock !== undefined) row.min_stock = i.minStock;
  if (i.price !== undefined) row.cost_price = i.price ?? null;
  if (i.form !== undefined) row.unit = i.form ?? null;
  if (i.expiryDate !== undefined) row.expiry_date = i.expiryDate || null;
  if (i.brand !== undefined) row.brand = i.brand ?? null;
  if (i.serialNumber !== undefined) row.serial_number = i.serialNumber ?? null;
  if (i.lastMaintenance !== undefined) row.last_maintenance = i.lastMaintenance || null;
  if (i.location !== undefined) row.location = i.location ?? null;
  return row;
}

async function list(supabase, { page = 0, pageSize = 200, search, type }) {
  const from = page * pageSize;
  const to = from + pageSize - 1;
  let q = supabase
    .from(TABLE)
    .select(SELECT, { count: 'exact' })
    .is('archived_at', null)
    .order('name', { ascending: true })
    .range(from, to);
  if (type) q = q.eq('type', type);
  if (search?.trim()) q = q.ilike('name', `%${search.trim()}%`);
  const { data, error, count } = await q;
  if (error) throw error;
  return { data: (data ?? []).map(fromDb), page, pageSize, total: count ?? 0 };
}

async function get(supabase, id) {
  const { data, error } = await supabase.from(TABLE).select(SELECT).eq('id', id).maybeSingle();
  if (error) throw error;
  return fromDb(data);
}

async function create(supabase, input, clinicId) {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ ...toDb(input), clinic_id: clinicId })
    .select(SELECT)
    .single();
  if (error) throw error;
  const created = fromDb(data);
  if (input.stock && input.stock > 0) {
    await supabase.from('inventory_transactions').insert({
      clinic_id: clinicId,
      item_id: created.id,
      type: 'purchase',
      quantity: input.stock,
      reason: 'Initial Stock',
    });
  }
  return created;
}

async function update(supabase, id, patch) {
  const { data, error } = await supabase
    .from(TABLE)
    .update(toDb(patch))
    .eq('id', id)
    .select(SELECT)
    .single();
  if (error) throw error;
  return fromDb(data);
}

async function archive(supabase, id) {
  const { error } = await supabase
    .from(TABLE)
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

async function remove(supabase, id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
}

async function adjustStock(supabase, id, delta, reason, clinicId) {
  const current = await get(supabase, id);
  if (!current) return null;
  const newStock = current.stock + delta;
  if (newStock < 0) {
    const err = new Error('Insufficient stock');
    err.status = 400;
    err.code = 'INSUFFICIENT_STOCK';
    throw err;
  }
  const updated = await update(supabase, id, { stock: newStock });
  await supabase.from('inventory_transactions').insert({
    clinic_id: clinicId,
    item_id: id,
    type: 'adjustment',
    quantity: delta,
    reason,
  });
  return updated;
}

module.exports = { list, get, create, update, archive, remove, adjustStock };
