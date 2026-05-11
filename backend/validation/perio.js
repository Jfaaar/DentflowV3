const { z } = require('zod');

const PERIO_POSITIONS = [
  'buccal_mesial', 'buccal_mid', 'buccal_distal',
  'lingual_mesial', 'lingual_mid', 'lingual_distal',
];

const perioSiteInputSchema = z.object({
  tooth: z.string().min(1),
  position: z.enum(PERIO_POSITIONS),
  pocketDepthMm: z.coerce.number().int().min(0).max(15).optional().nullable(),
  recessionMm: z.coerce.number().int().min(0).max(15).optional().nullable(),
  bleedingOnProbing: z.coerce.boolean().optional(),
  suppuration: z.coerce.boolean().optional(),
  mobility: z.coerce.number().int().min(0).max(3).optional().nullable(),
  furcation: z.coerce.number().int().min(0).max(4).optional().nullable(),
});

const perioChartCreateSchema = z.object({
  patientId: z.string().min(1),
  chartedAt: z.string().optional(),
  chartedBy: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  sites: z.array(perioSiteInputSchema).optional(),
});

const perioChartUpdateSchema = z.object({
  patientId: z.string().min(1).optional(),
  chartedAt: z.string().optional(),
  chartedBy: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const perioSitesReplaceSchema = z.object({
  sites: z.array(perioSiteInputSchema),
});

const perioChartListQuerySchema = z.object({
  page: z.coerce.number().int().min(0).optional().default(0),
  pageSize: z.coerce.number().int().min(1).max(500).optional().default(50),
  patientId: z.string().optional(),
});

module.exports = {
  PERIO_POSITIONS,
  perioSiteInputSchema,
  perioChartCreateSchema,
  perioChartUpdateSchema,
  perioSitesReplaceSchema,
  perioChartListQuerySchema,
};
