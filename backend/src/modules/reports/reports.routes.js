const router = require('express').Router();
const { authenticate, authorize } = require('../../middleware/auth');
const ctrl = require('./reports.controller');

const REPORT_ROLES = ['FleetManager', 'SafetyOfficer', 'FinancialAnalyst'];
const ALL = ['FleetManager', 'Driver', 'SafetyOfficer', 'FinancialAnalyst'];

router.use(authenticate);

// Dashboard endpoints
router.get('/dashboard/kpis',       authorize(...ALL),         ctrl.kpis);
router.get('/dashboard/compliance', authorize(...ALL),         ctrl.compliance);

// Report endpoints
router.get('/fuel-efficiency',  authorize(...REPORT_ROLES), ctrl.fuelEfficiency);
router.get('/utilization',      authorize(...REPORT_ROLES), ctrl.utilization);
router.get('/operational-cost', authorize(...REPORT_ROLES), ctrl.operationalCost);
router.get('/roi',              authorize(...REPORT_ROLES), ctrl.roi);
router.get('/export.csv',       authorize(...REPORT_ROLES), ctrl.exportCsv);

module.exports = router;
