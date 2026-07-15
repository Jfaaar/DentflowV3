// Clinic settings — pg. One row per clinic_id.
function fromDb(row) {
  if (!row) return null;
  return {
    clinicId: row.clinic_id,
    logoUrl: row.logo_url ?? undefined,
    taxId: row.tax_id ?? undefined,
    currency: row.currency ?? 'MAD',
    timezone: row.timezone ?? 'Africa/Casablanca',
    defaultLanguage: row.default_language ?? 'fr',
    workingHours: row.working_hours ?? undefined,
    defaultAppointmentMinutes: row.default_appointment_minutes ?? 30,
    invoiceNumberFormat: row.invoice_number_format ?? 'INV-{YYYY}-{SEQ}',
    invoiceSeq: row.invoice_seq ?? 0,
    prescriptionTemplate: row.prescription_template ?? undefined,
    quoteTemplate: row.quote_template ?? undefined,
    primarySpecialty: row.primary_specialty ?? 'general_practice',
    enabledSpecialties: row.enabled_specialties ?? ['general_practice'],
    updatedAt: row.updated_at,
  };
}

const COLS = {
  logoUrl: 'logo_url',
  taxId: 'tax_id',
  currency: 'currency',
  timezone: 'timezone',
  defaultLanguage: 'default_language',
  workingHours: 'working_hours',
  defaultAppointmentMinutes: 'default_appointment_minutes',
  invoiceNumberFormat: 'invoice_number_format',
  invoiceSeq: 'invoice_seq',
  prescriptionTemplate: 'prescription_template',
  quoteTemplate: 'quote_template',
  primarySpecialty: 'primary_specialty',
  enabledSpecialties: 'enabled_specialties',
};

async function get(db, clinicId) {
  const r = await db.query(
    `SELECT * FROM clinic_settings WHERE clinic_id = $1 LIMIT 1`,
    [clinicId],
  );
  return fromDb(r.rows[0]);
}

async function upsert(db, clinicId, patch) {
  // Build an INSERT ... ON CONFLICT (clinic_id) DO UPDATE SET ...
  const cols = ['clinic_id'];
  const vals = [clinicId];
  for (const [k, col] of Object.entries(COLS)) {
    if (patch[k] !== undefined) {
      cols.push(col);
      vals.push(patch[k] ?? null);
    }
  }
  if (cols.length === 1) return get(db, clinicId);
  const placeholders = vals.map((_, i) => `$${i + 1}`).join(', ');
  const updates = cols.slice(1).map((c) => `${c} = EXCLUDED.${c}`).join(', ');
  const r = await db.query(
    `INSERT INTO clinic_settings (${cols.join(', ')}) VALUES (${placeholders})
     ON CONFLICT (clinic_id) DO UPDATE SET ${updates}, updated_at = NOW()
     RETURNING *`,
    vals,
  );
  return fromDb(r.rows[0]);
}

module.exports = { get, upsert };
