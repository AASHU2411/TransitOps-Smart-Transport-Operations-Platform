const { z } = require('zod');

const signupSchema = z.object({
  name:  z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['FleetManager', 'Driver', 'SafetyOfficer', 'FinancialAnalyst']).optional(),
});

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

module.exports = { signupSchema, loginSchema };
