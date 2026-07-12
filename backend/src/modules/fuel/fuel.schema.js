const { z } = require('zod');

const fuelSchema = z.object({
  vehicleId: z.string().uuid(),
  liters:    z.number().positive(),
  cost:      z.number().positive(),
  date:      z.string().refine(d => !isNaN(Date.parse(d)), 'Invalid date'),
});

module.exports = { fuelSchema };
