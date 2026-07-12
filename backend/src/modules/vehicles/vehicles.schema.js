const { z } = require('zod');

const vehicleSchema = z.object({
  regNo:           z.string().min(1),
  name:            z.string().min(1),
  type:            z.enum(['Van', 'Truck', 'Pickup', 'Bus', 'Trailer']),
  maxLoad:         z.number().int().positive(),
  odometer:        z.number().int().min(0).optional(),
  acquisitionCost: z.number().positive(),
  status:          z.enum(['Available', 'OnTrip', 'InShop', 'Retired']).optional(),
  region:          z.string().min(1),
});

const vehicleUpdateSchema = vehicleSchema.partial();

module.exports = { vehicleSchema, vehicleUpdateSchema };
