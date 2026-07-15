const { z } = require('zod');

const inventoryTxnCreateSchema = z.object({
  medicamentId: z.string().min(1),
  type: z.enum(['IN', 'OUT', 'ADJUST']),
  quantity: z.number().positive(),
  reason: z.string().optional().nullable(),
});

const inventoryTxnListQuerySchema = z.object({
  page: z.coerce.number().int().min(0).optional().default(0),
  pageSize: z.coerce.number().int().min(1).max(500).optional().default(200),
  itemId: z.string().optional(),
});

module.exports = { inventoryTxnCreateSchema, inventoryTxnListQuerySchema };
