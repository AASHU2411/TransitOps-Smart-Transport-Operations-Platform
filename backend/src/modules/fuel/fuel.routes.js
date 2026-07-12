const router = require('express').Router();
const { authenticate, authorize } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { fuelSchema } = require('./fuel.schema');
const ctrl = require('./fuel.controller');

router.use(authenticate);

router.get('/',  ctrl.list);
router.post('/', authorize('FleetManager', 'FinancialAnalyst'), validate(fuelSchema), ctrl.create);

module.exports = router;
