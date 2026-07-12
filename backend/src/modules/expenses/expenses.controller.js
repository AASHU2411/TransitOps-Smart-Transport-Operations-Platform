const svc = require('./expenses.service');

async function list(req, res, next) {
  try { res.json(await svc.list(req.query)); } catch (e) { next(e); }
}
async function create(req, res, next) {
  try { res.status(201).json(await svc.create(req.body)); } catch (e) { next(e); }
}

module.exports = { list, create };
