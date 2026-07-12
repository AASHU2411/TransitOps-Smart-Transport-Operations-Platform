const router = require('express').Router();
const { authenticate, authorize } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { tripSchema, completeSchema } = require('./trips.schema');
const ctrl = require('./trips.controller');

router.use(authenticate);

router.get('/',                authorize('FleetManager', 'Driver', 'SafetyOfficer', 'FinancialAnalyst'), ctrl.list);
router.get('/:id',             authorize('FleetManager', 'Driver', 'SafetyOfficer', 'FinancialAnalyst'), ctrl.getOne);
router.post('/',               authorize('FleetManager', 'Driver'), validate(tripSchema), ctrl.create);
router.post('/:id/dispatch',   authorize('FleetManager', 'Driver'), ctrl.dispatch);
router.post('/:id/complete',   authorize('FleetManager', 'Driver'), validate(completeSchema), ctrl.complete);
router.post('/:id/cancel',     authorize('FleetManager', 'Driver'), ctrl.cancel);

module.exports = router;
