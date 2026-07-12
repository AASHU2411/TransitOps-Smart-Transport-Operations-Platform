const router = require('express').Router();
const { authenticate, authorize } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { expenseSchema } = require('./expenses.schema');
const ctrl = require('./expenses.controller');

router.use(authenticate);

router.get('/',  ctrl.list);
router.post('/', authorize('FleetManager', 'FinancialAnalyst'), validate(expenseSchema), ctrl.create);

module.exports = router;
