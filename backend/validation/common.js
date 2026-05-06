const { z } = require('zod');

const idParamSchema = z.object({ id: z.string().min(1) });

const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(0).optional().default(0),
  pageSize: z.coerce.number().int().min(1).max(200).optional().default(50),
  search: z.string().optional(),
});

module.exports = { idParamSchema, paginationQuerySchema };
