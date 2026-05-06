const { z } = require('zod');

const APPOINTMENT_STATUSES = ['pending', 'confirmed', 'in_progress', 'completed', 'canceled', 'no_show'];

const appointmentCreateSchema = z.object({
  patientId: z.string().min(1),
  start: z.string().min(1),
  end: z.string().min(1),
  status: z.enum(APPOINTMENT_STATUSES).optional(),
  observation: z.string().optional().nullable(),
});

const appointmentUpdateSchema = appointmentCreateSchema.partial();

const appointmentsListQuerySchema = z.object({
  page: z.coerce.number().int().min(0).optional().default(0),
  pageSize: z.coerce.number().int().min(1).max(500).optional().default(200),
  patientId: z.string().optional(),
  status: z.enum(APPOINTMENT_STATUSES).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

const cancelManyBodySchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
});

const cancelBodySchema = z.object({
  reason: z.string().optional().nullable(),
});

module.exports = {
  appointmentCreateSchema,
  appointmentUpdateSchema,
  appointmentsListQuerySchema,
  cancelManyBodySchema,
  cancelBodySchema,
};
