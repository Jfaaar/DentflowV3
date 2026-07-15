const { z } = require('zod');

const CLAIM_STATUSES = ['draft', 'submitted', 'approved', 'partial', 'rejected', 'paid'];

const policyCreateSchema = z.object({
  patientId: z.string().min(1),
  providerId: z.string().optional().nullable(),
  policyNumber: z.string().optional().nullable(),
  coveragePct: z.number().optional().nullable(),
  validUntil: z.string().optional().nullable(),
});

const policyUpdateSchema = z.object({
  providerId: z.string().optional().nullable(),
  policyNumber: z.string().optional().nullable(),
  coveragePct: z.number().optional().nullable(),
  validUntil: z.string().optional().nullable(),
});

const policiesListQuerySchema = z.object({
  page: z.coerce.number().int().min(0).optional().default(0),
  pageSize: z.coerce.number().int().min(1).max(500).optional().default(50),
  patientId: z.string().optional(),
});

const claimCreateSchema = z.object({
  patientId: z.string().min(1),
  invoiceId: z.string().optional().nullable(),
  policyId: z.string().optional().nullable(),
  status: z.enum(CLAIM_STATUSES),
  submittedAt: z.string().optional().nullable(),
  amountClaimed: z.number().optional().nullable(),
  amountReimbursed: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const claimUpdateSchema = claimCreateSchema.partial();

const claimsListQuerySchema = z.object({
  page: z.coerce.number().int().min(0).optional().default(0),
  pageSize: z.coerce.number().int().min(1).max(500).optional().default(50),
  patientId: z.string().optional(),
  status: z.enum(CLAIM_STATUSES).optional(),
});

module.exports = {
  policyCreateSchema,
  policyUpdateSchema,
  policiesListQuerySchema,
  claimCreateSchema,
  claimUpdateSchema,
  claimsListQuerySchema,
};
