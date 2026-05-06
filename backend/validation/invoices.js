const { z } = require('zod');

const INVOICE_STATUSES = ['draft', 'unpaid', 'partial', 'paid', 'overdue', 'void'];

const invoiceCreateSchema = z.object({
  patientId: z.string().min(1),
  appointmentId: z.string().optional().nullable(),
  amount: z.number(),
  paidAmount: z.number().optional(),
  status: z.enum(INVOICE_STATUSES).optional(),
  date: z.string().optional(),
});

const invoiceUpdateSchema = z.object({
  amount: z.number().optional(),
  paidAmount: z.number().optional(),
  status: z.enum(INVOICE_STATUSES).optional(),
  date: z.string().optional(),
});

const invoicesListQuerySchema = z.object({
  page: z.coerce.number().int().min(0).optional().default(0),
  pageSize: z.coerce.number().int().min(1).max(500).optional().default(100),
  patientId: z.string().optional(),
  status: z.enum(INVOICE_STATUSES).optional(),
});

module.exports = { invoiceCreateSchema, invoiceUpdateSchema, invoicesListQuerySchema };
