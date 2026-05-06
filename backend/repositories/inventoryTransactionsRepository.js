const TABLE = 'inventory_transactions';
const SELECT = '*, item:inventory_items(name)';

const num = (v) => (v == null ? 0 : typeof v === 'number' ? v : Number(v) || 0);

function toLegacyType(t, qty) {
  if (t === 'adjustment') return 'ADJUST';
  if (t === 'purchase' || t === 'return') return 'IN';
  if (qty < 0) return 'OUT';
  return t === 'usage' ? 'OUT' : 'IN';
}

function fromDb(row) {
  if (!row) return null;
  const qty = num(row.quantity);
  return {
    id: row.id,
    medicamentId: row.item_id,
    medicamentName: row.item?.name ?? '',
    type: toLegacyType(row.type, qty),
    quantity: Math.abs(qty),
    reason: row.reason ?? undefined,
    date: row.created_at,
  };
}

async function list(supabase, { page = 0, pageSize = 200, itemId }) {
  const from = page * pageSize;
  const to = from + pageSize - 1;
  let q = supabase
    .from(TABLE)
    .select(SELECT, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);
  if (itemId) q = q.eq('item_id', itemId);
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
  const dbType = input.type === 'IN' ? 'purchase' : input.type === 'OUT' ? 'usage' : 'adjustment';
  const signedQty = input.type === 'OUT' ? -Math.abs(input.quantity) : Math.abs(input.quantity);
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      clinic_id: clinicId,
      item_id: input.medicamentId,
      type: dbType,
      quantity: signedQty,
      reason: input.reason ?? null,
    })
    .select(SELECT)
    .single();
  if (error) throw error;
  return fromDb(data);
}

async function remove(supabase, id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
}

module.exports = { list, get, create, remove };
