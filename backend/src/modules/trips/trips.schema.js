const { z } = require('zod');

const tripSchema = z.object({
  source:          z.string().min(1),
  destination:     z.string().min(1),
  vehicleId:       z.string().uuid(),
  driverId:        z.string().uuid(),
  cargoWeight:     z.number().int().positive(),
  plannedDistance: z.number().int().positive(),
});

const completeSchema = z.object({
  finalOdometer: z.number().int().positive(),
  fuelConsumed:  z.number().positive(),
});

module.exports = { tripSchema, completeSchema };
