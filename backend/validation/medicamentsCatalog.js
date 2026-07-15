const { z } = require('zod');

const medicamentsListQuerySchema = z.object({
  page: z.coerce.number().int().min(0).optional().default(0),
  pageSize: z.coerce.number().int().min(1).max(200).optional().default(50),
  search: z.string().optional(),
  substance: z.string().optional(),
  laboratoire: z.string().optional(),
  // Exact specialite match — used by the variants drilldown so it returns
  // ONLY that brand's variants, not anything containing the substring.
  specialite: z.string().optional(),
});

const medicamentGroupsQuerySchema = z.object({
  page: z.coerce.number().int().min(0).optional().default(0),
  pageSize: z.coerce.number().int().min(1).max(200).optional().default(24),
  search: z.string().optional(),
  substance: z.string().optional(),
  laboratoire: z.string().optional(),
});

const medicamentHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(0).optional().default(0),
  pageSize: z.coerce.number().int().min(1).max(200).optional().default(50),
});

module.exports = {
  medicamentsListQuerySchema,
  medicamentGroupsQuerySchema,
  medicamentHistoryQuerySchema,
};
