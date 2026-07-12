const router = require('express').Router();
const { authenticate, authorize } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { maintenanceSchema } = require('./maintenance.schema');
const ctrl = require('./maintenance.controller');

router.use(authenticate);

router.get('/',           ctrl.list);
router.get('/:id',        ctrl.getOne);
router.post('/',          authorize('FleetManager'), validate(maintenanceSchema), ctrl.create);
router.post('/:id/close', authorize('FleetManager'), ctrl.close);

module.exports = router;
