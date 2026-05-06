const { z } = require('zod');

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
});

module.exports = { clinicSettingsUpdateSchema };
