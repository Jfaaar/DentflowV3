const { z } = require('zod');

const PLAN_STATUSES = ['draft', 'proposed', 'accepted', 'in_progress', 'completed', 'canceled'];

const treatmentPlanCreateSchema = z.object({
  patientId: z.string().min(1),
  doctorId: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  status: z.enum(PLAN_STATUSES),
  estimatedTotal: z.number().optional(),
  discount: z.number().optional(),
  insuranceCovered: z.number().optional(),
  patientResponsibility: z.number().optional(),
  acceptedAt: z.string().optional().nullable(),
});

const treatmentPlanUpdateSchema = treatmentPlanCreateSchema.partial();

const treatmentPlansListQuerySchema = z.object({
  page: z.coerce.number().int().min(0).optional().default(0),
  pageSize: z.coerce.number().int().min(1).max(500).optional().default(50),
  patientId: z.string().optional(),
  status: z.enum(PLAN_STATUSES).optional(),
});

module.exports = {
  treatmentPlanCreateSchema,
  treatmentPlanUpdateSchema,
  treatmentPlansListQuerySchema,
};
