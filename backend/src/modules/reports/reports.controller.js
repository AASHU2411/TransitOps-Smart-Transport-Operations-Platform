const svc = require('./reports.service');

async function kpis(req, res, next) {
  try { res.json(await svc.kpis(req.query)); } catch (e) { next(e); }
}
async function compliance(req, res, next) {
  try { res.json(await svc.compliance()); } catch (e) { next(e); }
}
async function fuelEfficiency(req, res, next) {
  try { res.json(await svc.fuelEfficiency(req.query)); } catch (e) { next(e); }
}
async function utilization(req, res, next) {
  try { res.json(await svc.utilization()); } catch (e) { next(e); }
}
async function operationalCost(req, res, next) {
  try { res.json(await svc.operationalCost(req.query)); } catch (e) { next(e); }
}
async function roi(req, res, next) {
  try { res.json(await svc.roi(req.query)); } catch (e) { next(e); }
}
async function exportCsv(req, res, next) {
  try { await svc.exportCsv(res, req.query); } catch (e) { next(e); }
}

module.exports = { kpis, compliance, fuelEfficiency, utilization, operationalCost, roi, exportCsv };
