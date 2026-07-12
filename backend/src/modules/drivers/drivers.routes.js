const router = require('express').Router();
const { authenticate, authorize } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { driverSchema, driverUpdateSchema } = require('./drivers.schema');
const ctrl = require('./drivers.controller');

router.use(authenticate);

router.get('/',       ctrl.list);
router.get('/:id',    ctrl.getOne);
router.post('/',      authorize('FleetManager', 'SafetyOfficer'), validate(driverSchema),       ctrl.create);
router.patch('/:id',  authorize('FleetManager', 'SafetyOfficer'), validate(driverUpdateSchema), ctrl.update);
router.delete('/:id', authorize('FleetManager', 'SafetyOfficer'), ctrl.remove);

module.exports = router;
