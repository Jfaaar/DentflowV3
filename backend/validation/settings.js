const { z } = require('zod');

const SPECIALTY_CODES = [
  'general_practice', 'dental', 'pediatrics', 'gynecology', 'cardiology',
  'dermatology', 'ent', 'ophthalmology', 'orthopedics', 'psychiatry', 'other',
];
const specialtyEnum = z.enum(SPECIALTY_CODES);

const clinicSettingsUpdateSchema = z.object({
  logoUrl: z.string().optional().nullable(),
  taxId: z.string().optional().nullable(),
  currency: z.string().optional(),
  timezone: z.string().optional(),
  defaultLanguage: z.string().optional(),
  workingHours: z.record(z.array(z.object({ start: z.string(), end: z.string() }))).optional().nullable(),
  defaultAppointmentMinutes: z.number().int().positive().optional(),
  invoiceNumberFormat: z.string().optional(),
  invoiceSeq: z.number().int().min(0).optional(),
  prescriptionTemplate: z.string().optional().nullable(),
  quoteTemplate: z.string().optional().nullable(),
  primarySpecialty: specialtyEnum.optional(),
  enabledSpecialties: z.array(specialtyEnum).min(1).optional(),
});

module.exports = { clinicSettingsUpdateSchema, SPECIALTY_CODES };
