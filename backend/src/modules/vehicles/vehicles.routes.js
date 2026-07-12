const router = require('express').Router();
const { authenticate, authorize } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { vehicleSchema, vehicleUpdateSchema } = require('./vehicles.schema');
const ctrl = require('./vehicles.controller');

const FM = 'FleetManager';

router.use(authenticate);

router.get('/',       ctrl.list);
router.get('/:id',    ctrl.getOne);
router.post('/',      authorize(FM), validate(vehicleSchema),       ctrl.create);
router.patch('/:id',  authorize(FM), validate(vehicleUpdateSchema), ctrl.update);
router.delete('/:id', authorize(FM), ctrl.remove);

module.exports = router;
