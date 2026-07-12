const { z } = require('zod');

const driverSchema = z.object({
  name:            z.string().min(2),
  licenseNumber:   z.string().min(3),
  licenseCategory: z.enum(['LMV', 'HMV', 'MCWG']),
  licenseExpiry:   z.string().refine(d => !isNaN(Date.parse(d)), 'Invalid date'),
  contact:         z.string().min(5),
  safetyScore:     z.number().int().min(0).max(100).optional(),
  status:          z.enum(['Available', 'OnTrip', 'OffDuty', 'Suspended']).optional(),
});

const driverUpdateSchema = driverSchema.partial();

module.exports = { driverSchema, driverUpdateSchema };
