const router = require('express').Router();
const { authenticate, authorize } = require('../../middleware/auth');
const ctrl = require('./users.controller');

router.use(authenticate, authorize('FleetManager'));

router.get('/',              ctrl.list);
router.patch('/:id/role',    ctrl.updateRole);
router.delete('/:id',        ctrl.remove);

module.exports = router;
