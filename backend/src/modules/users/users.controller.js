const { z } = require('zod');
const svc = require('./users.service');

const roleSchema = z.object({
  role: z.enum(['FleetManager', 'Driver', 'SafetyOfficer', 'FinancialAnalyst']),
});

async function list(req, res, next) {
  try { res.json(await svc.list(req.query)); } catch (e) { next(e); }
}

async function updateRole(req, res, next) {
  try {
    const result = roleSchema.safeParse(req.body);
    if (!result.success) return res.status(422).json({ error: 'Invalid role' });
    res.json(await svc.updateRole(req.params.id, result.data.role));
  } catch (e) { next(e); }
}

async function remove(req, res, next) {
  try { res.json(await svc.remove(req.params.id, req.user.sub)); } catch (e) { next(e); }
}

module.exports = { list, updateRole, remove };
