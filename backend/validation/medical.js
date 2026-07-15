const { z } = require('zod');

// ─── Vital signs ─────────────────────────────────────────────────────────────
const vitalSignsCreateSchema = z.object({
  patientId: z.string().min(1),
  recordedBy: z.string().optional().nullable(),
  recordedAt: z.string().optional(),
  systolicBp: z.coerce.number().int().min(0).max(400).optional().nullable(),
  diastolicBp: z.coerce.number().int().min(0).max(300).optional().nullable(),
  heartRate: z.coerce.number().int().min(0).max(400).optional().nullable(),
  temperatureC: z.coerce.number().min(20).max(50).optional().nullable(),
  respiratoryRate: z.coerce.number().int().min(0).max(120).optional().nullable(),
  spo2: z.coerce.number().int().min(0).max(100).optional().nullable(),
  weightKg: z.coerce.number().min(0).max(500).optional().nullable(),
  heightCm: z.coerce.number().min(0).max(300).optional().nullable(),
  painScore: z.coerce.number().int().min(0).max(10).optional().nullable(),
  notes: z.string().optional().nullable(),
});
const vitalSignsUpdateSchema = vitalSignsCreateSchema.partial();
const vitalSignsListQuerySchema = z.object({
  page: z.coerce.number().int().min(0).optional().default(0),
  pageSize: z.coerce.number().int().min(1).max(500).optional().default(50),
  patientId: z.string().optional(),
});

// ─── Problem list ────────────────────────────────────────────────────────────
const problemCreateSchema = z.object({
  patientId: z.string().min(1),
  icd10Code: z.string().optional().nullable(),
  icd10Label: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  status: z.enum(['active', 'resolved', 'chronic', 'inactive']).optional(),
  onsetDate: z.string().optional().nullable(),
  resolvedDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
}).refine((v) => v.icd10Code || v.description, {
  message: 'Either icd10Code or description is required',
  path: ['description'],
});
const problemUpdateSchema = z.object({
  patientId: z.string().min(1).optional(),
  icd10Code: z.string().optional().nullable(),
  icd10Label: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  status: z.enum(['active', 'resolved', 'chronic', 'inactive']).optional(),
  onsetDate: z.string().optional().nullable(),
  resolvedDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});
const problemListQuerySchema = z.object({
  page: z.coerce.number().int().min(0).optional().default(0),
  pageSize: z.coerce.number().int().min(1).max(500).optional().default(100),
  patientId: z.string().optional(),
  status: z.enum(['active', 'resolved', 'chronic', 'inactive']).optional(),
});

// ─── Vaccinations ────────────────────────────────────────────────────────────
const vaccinationCreateSchema = z.object({
  patientId: z.string().min(1),
  vaccineName: z.string().min(1),
  administeredDate: z.string().min(1),
  doseNumber: z.coerce.number().int().min(1).optional().nullable(),
  lotNumber: z.string().optional().nullable(),
  manufacturer: z.string().optional().nullable(),
  site: z.string().optional().nullable(),
  route: z.string().optional().nullable(),
  nextDoseDate: z.string().optional().nullable(),
  administeredBy: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});
const vaccinationUpdateSchema = vaccinationCreateSchema.partial();
const vaccinationListQuerySchema = z.object({
  page: z.coerce.number().int().min(0).optional().default(0),
  pageSize: z.coerce.number().int().min(1).max(500).optional().default(100),
  patientId: z.string().optional(),
});

// ─── Body region findings ───────────────────────────────────────────────────
const bodyRegionCreateSchema = z.object({
  patientId: z.string().min(1),
  region: z.string().min(1),
  side: z.enum(['left', 'right', 'center', 'bilateral']).optional().nullable(),
  finding: z.string().min(1),
  severity: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  recordedAt: z.string().optional(),
  recordedBy: z.string().optional().nullable(),
});
const bodyRegionUpdateSchema = bodyRegionCreateSchema.partial();
const bodyRegionListQuerySchema = z.object({
  page: z.coerce.number().int().min(0).optional().default(0),
  pageSize: z.coerce.number().int().min(1).max(500).optional().default(200),
  patientId: z.string().optional(),
});

module.exports = {
  vitalSignsCreateSchema,
  vitalSignsUpdateSchema,
  vitalSignsListQuerySchema,
  problemCreateSchema,
  problemUpdateSchema,
  problemListQuerySchema,
  vaccinationCreateSchema,
  vaccinationUpdateSchema,
  vaccinationListQuerySchema,
  bodyRegionCreateSchema,
  bodyRegionUpdateSchema,
  bodyRegionListQuerySchema,
};
