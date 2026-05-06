const TABLE = 'clinic_settings';

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
    updatedAt: row.updated_at,
  };
}

function toDb(s) {
  const row = {};
  if (s.logoUrl !== undefined) row.logo_url = s.logoUrl ?? null;
  if (s.taxId !== undefined) row.tax_id = s.taxId ?? null;
  if (s.currency !== undefined) row.currency = s.currency;
  if (s.timezone !== undefined) row.timezone = s.timezone;
  if (s.defaultLanguage !== undefined) row.default_language = s.defaultLanguage;
  if (s.workingHours !== undefined) row.working_hours = s.workingHours ?? null;
  if (s.defaultAppointmentMinutes !== undefined)
    row.default_appointment_minutes = s.defaultAppointmentMinutes;
  if (s.invoiceNumberFormat !== undefined) row.invoice_number_format = s.invoiceNumberFormat;
  if (s.invoiceSeq !== undefined) row.invoice_seq = s.invoiceSeq;
  if (s.prescriptionTemplate !== undefined) row.prescription_template = s.prescriptionTemplate ?? null;
  if (s.quoteTemplate !== undefined) row.quote_template = s.quoteTemplate ?? null;
  return row;
}

async function get(supabase, clinicId) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('clinic_id', clinicId)
    .maybeSingle();
  if (error) throw error;
  return fromDb(data);
}

async function upsert(supabase, clinicId, patch) {
  const { data, error } = await supabase
    .from(TABLE)
    .upsert({ clinic_id: clinicId, ...toDb(patch) }, { onConflict: 'clinic_id' })
    .select('*')
    .single();
  if (error) throw error;
  return fromDb(data);
}

module.exports = { get, upsert };
