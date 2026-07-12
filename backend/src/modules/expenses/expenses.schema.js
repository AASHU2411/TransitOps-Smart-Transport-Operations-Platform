const { z } = require('zod');

const expenseSchema = z.object({
  vehicleId: z.string().uuid(),
  type:      z.enum(['Toll', 'Parking', 'Fine', 'Permit', 'Other']),
  amount:    z.number().positive(),
  note:      z.string().optional(),
  date:      z.string().refine(d => !isNaN(Date.parse(d)), 'Invalid date'),
});

module.exports = { expenseSchema };
