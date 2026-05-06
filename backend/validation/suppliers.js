const { z } = require('zod');

const supplierCreateSchema = z.object({
  name: z.string().min(1),
  contactPerson: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  address: z.string().optional().nullable(),
});

const supplierUpdateSchema = supplierCreateSchema.partial();

const suppliersListQuerySchema = z.object({
  page: z.coerce.number().int().min(0).optional().default(0),
  pageSize: z.coerce.number().int().min(1).max(500).optional().default(200),
  search: z.string().optional(),
});

module.exports = { supplierCreateSchema, supplierUpdateSchema, suppliersListQuerySchema };
