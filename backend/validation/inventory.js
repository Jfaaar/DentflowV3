const { z } = require('zod');

const INVENTORY_TYPES = ['medication', 'consumable', 'equipment', 'instrument', 'other'];

const inventoryItemCreateSchema = z.object({
  name: z.string().min(1),
  type: z.enum(INVENTORY_TYPES),
  category: z.string().optional().nullable(),
  stock: z.number().min(0).optional().default(0),
  minStock: z.number().min(0).optional().default(0),
  price: z.number().optional().nullable(),
  form: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  serialNumber: z.string().optional().nullable(),
  lastMaintenance: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
});

const inventoryItemUpdateSchema = inventoryItemCreateSchema.partial();

const inventoryListQuerySchema = z.object({
  page: z.coerce.number().int().min(0).optional().default(0),
  pageSize: z.coerce.number().int().min(1).max(500).optional().default(200),
  search: z.string().optional(),
  type: z.enum(INVENTORY_TYPES).optional(),
});

const adjustStockBodySchema = z.object({
  delta: z.number(),
  reason: z.string().min(1),
});

module.exports = {
  inventoryItemCreateSchema,
  inventoryItemUpdateSchema,
  inventoryListQuerySchema,
  adjustStockBodySchema,
};
