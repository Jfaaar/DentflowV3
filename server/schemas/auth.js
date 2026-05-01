const { z } = require('zod');

const acceptInvitationSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().trim().min(1).optional(),
});

const tokenParamSchema = z.object({
  token: z.string().min(8),
});

module.exports = { acceptInvitationSchema, tokenParamSchema };
