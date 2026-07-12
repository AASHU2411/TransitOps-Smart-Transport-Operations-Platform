const { z } = require('zod');

const maintenanceSchema = z.object({
  vehicleId:   z.string().uuid(),
  type:        z.enum(['OilChange', 'TyreReplacement', 'BrakeService', 'EngineRepair', 'Inspection', 'Other']),
  description: z.string().optional(),
  cost:        z.number().nonnegative(),
  date:        z.string().refine(d => !isNaN(Date.parse(d)), 'Invalid date'),
});

module.exports = { maintenanceSchema };
