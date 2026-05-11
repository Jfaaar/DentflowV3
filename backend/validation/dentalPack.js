// Zod schemas for the dental pack: endo records, ortho episodes / visits,
// dental lab cases. Perio schemas live in their own file (validation/perio.js).

const { z } = require('zod');

const listQuery = (extra = {}) => z.object({
  page: z.coerce.number().int().min(0).optional().default(0),
  pageSize: z.coerce.number().int().min(1).max(500).optional().default(50),
  patientId: z.string().optional(),
  ...extra,
});

// ─── Endodontic records ─────────────────────────────────────────────────────
const endoCanalSchema = z.object({
  name: z.string().optional(),
  lengthMm: z.coerce.number().min(0).max(40).optional(),
  fileSize: z.string().optional(),
  obturation: z.string().optional(),
}).passthrough();

const endoCreateSchema = z.object({
  patientId: z.string().min(1),
  tooth: z.string().min(1),
  treatmentDate: z.string().optional(),
  treatedBy: z.string().optional().nullable(),
  diagnosis: z.string().optional().nullable(),
  canals: z.array(endoCanalSchema).optional(),
  notes: z.string().optional().nullable(),
});
const endoUpdateSchema = endoCreateSchema.partial();
const endoListQuerySchema = listQuery();

// ─── Ortho episodes ─────────────────────────────────────────────────────────
const ORTHO_STATUS = ['active', 'retention', 'completed', 'discontinued'];

const orthoEpisodeCreateSchema = z.object({
  patientId: z.string().min(1),
  startDate: z.string().optional(),
  endDate: z.string().optional().nullable(),
  applianceType: z.string().optional().nullable(),
  plan: z.string().optional().nullable(),
  status: z.enum(ORTHO_STATUS).optional(),
  photoFileIds: z.array(z.string()).optional(),
  notes: z.string().optional().nullable(),
});
const orthoEpisodeUpdateSchema = orthoEpisodeCreateSchema.partial();
const orthoEpisodeListQuerySchema = listQuery({
  status: z.enum(ORTHO_STATUS).optional(),
});

// ─── Ortho visits ───────────────────────────────────────────────────────────
const orthoVisitCreateSchema = z.object({
  visitDate: z.string().optional(),
  changes: z.string().optional().nullable(),
  adjustments: z.string().optional().nullable(),
  photoFileIds: z.array(z.string()).optional(),
  performedBy: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});
const orthoVisitUpdateSchema = orthoVisitCreateSchema.partial();
const orthoVisitListQuerySchema = z.object({
  page: z.coerce.number().int().min(0).optional().default(0),
  pageSize: z.coerce.number().int().min(1).max(500).optional().default(100),
});

// ─── Dental lab cases ───────────────────────────────────────────────────────
const LAB_CASE_TYPE = [
  'crown', 'bridge', 'denture', 'veneer',
  'implant_abutment', 'retainer', 'nightguard', 'other',
];
const LAB_CASE_STATUS = [
  'sent', 'in_progress', 'received', 'delivered', 'cancelled',
];

const dentalLabCreateSchema = z.object({
  patientId: z.string().min(1),
  labName: z.string().min(1),
  caseType: z.enum(LAB_CASE_TYPE),
  status: z.enum(LAB_CASE_STATUS).optional(),
  sentDate: z.string().optional(),
  dueDate: z.string().optional().nullable(),
  receivedDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});
const dentalLabUpdateSchema = dentalLabCreateSchema.partial();
const dentalLabListQuerySchema = listQuery({
  status: z.enum(LAB_CASE_STATUS).optional(),
});

module.exports = {
  ORTHO_STATUS,
  LAB_CASE_TYPE,
  LAB_CASE_STATUS,
  endoCreateSchema,
  endoUpdateSchema,
  endoListQuerySchema,
  orthoEpisodeCreateSchema,
  orthoEpisodeUpdateSchema,
  orthoEpisodeListQuerySchema,
  orthoVisitCreateSchema,
  orthoVisitUpdateSchema,
  orthoVisitListQuerySchema,
  dentalLabCreateSchema,
  dentalLabUpdateSchema,
  dentalLabListQuerySchema,
};
