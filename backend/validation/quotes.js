const { z } = require('zod');

const QUOTE_STATUSES = ['draft', 'sent', 'accepted', 'rejected', 'expired'];

const quoteCreateSchema = z.object({
  patientId: z.string().min(1),
  total: z.number(),
  status: z.enum(QUOTE_STATUSES).optional(),
});

const quoteUpdateSchema = z.object({
  total: z.number().optional(),
  status: z.enum(QUOTE_STATUSES).optional(),
});

const quotesListQuerySchema = z.object({
  page: z.coerce.number().int().min(0).optional().default(0),
  pageSize: z.coerce.number().int().min(1).max(500).optional().default(50),
  patientId: z.string().optional(),
});

module.exports = { quoteCreateSchema, quoteUpdateSchema, quotesListQuerySchema };
