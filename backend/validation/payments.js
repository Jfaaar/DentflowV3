const { z } = require('zod');

const PAYMENT_METHODS = ['cash', 'card', 'transfer', 'check', 'insurance'];

const paymentCreateSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.number(),
  method: z.enum(PAYMENT_METHODS).optional(),
  date: z.string().optional(),
  note: z.string().optional().nullable(),
});

const paymentUpdateSchema = z.object({
  amount: z.number().optional(),
  method: z.enum(PAYMENT_METHODS).optional(),
  date: z.string().optional(),
  note: z.string().optional().nullable(),
});

const paymentsListQuerySchema = z.object({
  page: z.coerce.number().int().min(0).optional().default(0),
  pageSize: z.coerce.number().int().min(1).max(500).optional().default(100),
  invoiceId: z.string().optional(),
});

module.exports = { paymentCreateSchema, paymentUpdateSchema, paymentsListQuerySchema };
