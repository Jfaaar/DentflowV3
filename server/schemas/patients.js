const { z } = require('zod');

const patientBaseSchema = z.object({
  name: z.string().trim().min(1),
  phone: z.string().trim().optional().nullable(),
  email: z.string().email().optional().nullable(),
  clinicId: z.string().optional().nullable(),
  birthDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
}).passthrough(); // patients carry many extra fields used by the frontend

const createPatientSchema = patientBaseSchema;
const updatePatientSchema = patientBaseSchema.partial();

const appointmentSchema = z.object({
  id: z.string().optional(),
  patientId: z.string().optional(),
  start: z.string().optional(),
  end: z.string().optional(),
  status: z.string().optional(),
}).passthrough();

const upsertAppointmentsSchema = z.object({
  appointment: appointmentSchema,
  cancelIds: z.array(z.string()).optional(),
});

const invoiceSchema = z.object({}).passthrough();

const idParamSchema = z.object({
  id: z.string().min(1),
});

module.exports = {
  createPatientSchema,
  updatePatientSchema,
  upsertAppointmentsSchema,
  invoiceSchema,
  idParamSchema,
};
