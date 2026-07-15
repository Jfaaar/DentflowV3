// Prescriptions — pg. Header row + item rows + inventory deduction.

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

async function fetchItems(db, prescriptionIds) {
  if (!prescriptionIds.length) return new Map();
  const r = await db.query(
    `SELECT * FROM prescription_items WHERE prescription_id = ANY($1::uuid[])`,
    [prescriptionIds],
  );
  const byPx = new Map();
  for (const row of r.rows) {
    if (!byPx.has(row.prescription_id)) byPx.set(row.prescription_id, []);
    byPx.get(row.prescription_id).push(row);
  }
  return byPx;
}

async function list(db, { page = 0, pageSize = 50, patientId }) {
  const where = []; const params = [];
  if (patientId) { params.push(patientId); where.push(`patient_id = $${params.length}`); }
  const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';
  params.push(pageSize); const limitIdx = params.length;
  params.push(page * pageSize); const offsetIdx = params.length;
  const dataSQL = `SELECT * FROM prescriptions ${whereSQL} ORDER BY created_at DESC LIMIT $${limitIdx} OFFSET $${offsetIdx}`;
  const countParams = params.slice(0, params.length - 2);
  const countSQL = `SELECT COUNT(*)::int AS count FROM prescriptions ${whereSQL}`;
  const [d, c] = await Promise.all([db.query(dataSQL, params), db.query(countSQL, countParams)]);
  const ids = d.rows.map((r) => r.id);
  const byPx = await fetchItems(db, ids);
  return {
    data: d.rows.map((r) => fromDb(r, byPx.get(r.id) || [])),
    page, pageSize, total: c.rows[0].count,
  };
}

async function get(db, id) {
  const r = await db.query(`SELECT * FROM prescriptions WHERE id = $1`, [id]);
  if (r.rowCount === 0) return null;
  const byPx = await fetchItems(db, [id]);
  return fromDb(r.rows[0], byPx.get(id) || []);
}

async function create(db, input, clinicId) {
  const head = await db.query(
    `INSERT INTO prescriptions (clinic_id, patient_id, notes) VALUES ($1, $2, $3) RETURNING id`,
    [clinicId, input.patientId, input.notes ?? null],
  );
  const id = head.rows[0].id;

  if (Array.isArray(input.items) && input.items.length > 0) {
    // Bulk insert item rows.
    const values = []; const placeholders = []; let idx = 1;
    for (const it of input.items) {
      values.push(
        clinicId, id, it.medicamentId || null, it.medicamentName,
        it.dosage || null, it.frequency || null, it.duration || null, it.note ?? null,
      );
      placeholders.push(
        `($${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++})`,
      );
    }
    await db.query(
      `INSERT INTO prescription_items
       (clinic_id, prescription_id, inventory_item_id, medication_name, dosage, frequency, duration, notes)
       VALUES ${placeholders.join(', ')}`,
      values,
    );

    // Inventory deduction (-1 unit per item linked to a real inventory_item).
    const tx = input.items.filter((it) => it.medicamentId);
    if (tx.length > 0) {
      const tv = []; const tp = []; let ti = 1;
      for (const it of tx) {
        tv.push(clinicId, it.medicamentId, 'usage', -1, 'Prescription', id);
        tp.push(`($${ti++}, $${ti++}, $${ti++}, $${ti++}, $${ti++}, $${ti++})`);
      }
      await db.query(
        `INSERT INTO inventory_transactions
         (clinic_id, item_id, type, quantity, reason, reference_id)
         VALUES ${tp.join(', ')}`,
        tv,
      );
    }
  }

  return get(db, id);
}

async function update(db, id, patch) {
  if (patch.notes !== undefined) {
    await db.query(`UPDATE prescriptions SET notes = $1 WHERE id = $2`, [patch.notes ?? null, id]);
  }
  return get(db, id);
}

async function remove(db, id) {
  await db.query(`DELETE FROM prescriptions WHERE id = $1`, [id]);
}

module.exports = { list, get, create, update, remove };
