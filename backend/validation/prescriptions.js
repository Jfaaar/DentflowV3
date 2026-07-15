const { z } = require('zod');

const prescriptionItemSchema = z.object({
  medicamentId: z.string().optional(),
  medicamentName: z.string().min(1),
  dosage: z.string().optional(),
  frequency: z.string().optional(),
  duration: z.string().optional(),
  note: z.string().optional().nullable(),
});

const prescriptionCreateSchema = z.object({
  patientId: z.string().min(1),
  items: z.array(prescriptionItemSchema).default([]),
  notes: z.string().optional().nullable(),
});

const prescriptionUpdateSchema = z.object({
  notes: z.string().optional().nullable(),
});

const prescriptionsListQuerySchema = z.object({
  page: z.coerce.number().int().min(0).optional().default(0),
  pageSize: z.coerce.number().int().min(1).max(500).optional().default(50),
  patientId: z.string().optional(),
});

module.exports = {
  prescriptionCreateSchema,
  prescriptionUpdateSchema,
  prescriptionsListQuerySchema,
};
