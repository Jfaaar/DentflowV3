const { z } = require('zod');

const createClinicSchema = z.object({
  name: z.string().trim().min(1, 'Clinic name is required'),
  address: z.string().trim().optional().nullable(),
  adminEmail: z.string().email('Valid admin email required'),
  adminName: z.string().trim().optional(),
  adminPassword: z.string().min(6).optional(),
});

const updateClinicSchema = z.object({
  name: z.string().trim().min(1).optional(),
  address: z.string().trim().optional().nullable(),
  email: z.string().email().optional(),
  phone: z.string().optional().nullable(),
  maxStaff: z.number().int().positive().optional(),
  subscriptionStatus: z.enum(['active', 'suspended', 'cancelled']).optional(),
}).refine(o => Object.keys(o).length > 0, { message: 'No fields to update' });

const adminCreateClinicSchema = z.object({
  name: z.string().trim().min(1),
  address: z.string().trim().optional().nullable(),
  phone: z.string().optional().nullable(),
  adminEmail: z.string().email(),
  adminName: z.string().trim().optional(),
});

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().trim().min(1),
  role: z.enum(['super_admin', 'clinic_admin', 'doctor', 'assistant']).optional(),
});

const updateUserSchema = z.object({
  name: z.string().trim().min(1).optional(),
  email: z.string().email().optional(),
}).refine(o => Object.keys(o).length > 0, { message: 'No fields to update' });

const resetPasswordSchema = z.object({
  password: z.string().min(6),
});

const roleChangeSchema = z.object({
  role: z.enum(['super_admin', 'clinic_admin', 'doctor', 'assistant']),
});

const adminCreateCustomerSchema = z.object({
  email: z.string().email(),
  name: z.string().trim().optional(),
  role: z.enum(['super_admin', 'clinic_admin', 'doctor', 'assistant']).optional(),
});

const createInvitationSchema = z.object({
  email: z.string().email(),
  role: z.enum(['doctor', 'assistant']),
});

const idParamSchema = z.object({
  id: z.string().min(1),
});

module.exports = {
  createClinicSchema,
  updateClinicSchema,
  adminCreateClinicSchema,
  createUserSchema,
  updateUserSchema,
  resetPasswordSchema,
  roleChangeSchema,
  adminCreateCustomerSchema,
  createInvitationSchema,
  idParamSchema,
};
