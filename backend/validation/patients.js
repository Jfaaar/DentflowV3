const { z } = require('zod');

// API DTO uses camelCase. Repository maps to/from snake_case columns.
const patientCreateSchema = z.object({
  name: z.string().trim().min(1),
  phone: z.string().trim().optional().nullable(),
  email: z.string().email().optional().nullable(),
  birthDate: z.string().optional().nullable(),
  gender: z.enum(['male', 'female', 'other']).optional().nullable(),
  address: z.string().optional().nullable(),
  profilePicture: z.string().optional().nullable(),
  insuranceProvider: z.string().optional().nullable(),
  status: z.enum(['active', 'archived']).optional().default('active'),
});

const patientUpdateSchema = patientCreateSchema.partial();

const patientsListQuerySchema = z.object({
  page: z.coerce.number().int().min(0).optional().default(0),
  pageSize: z.coerce.number().int().min(1).max(200).optional().default(50),
  search: z.string().optional(),
  status: z.enum(['active', 'archived']).optional(),
});

module.exports = {
  patientCreateSchema,
  patientUpdateSchema,
  patientsListQuerySchema,
};
