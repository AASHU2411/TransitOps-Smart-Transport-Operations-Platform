const svc = require('./trips.service');

async function list(req, res, next) {
  try { res.json(await svc.list(req.query)); } catch (e) { next(e); }
}
async function getOne(req, res, next) {
  try { res.json(await svc.getById(req.params.id)); } catch (e) { next(e); }
}
async function create(req, res, next) {
  try { res.status(201).json(await svc.create(req.body, req.user.sub)); } catch (e) { next(e); }
}
async function dispatch(req, res, next) {
  try { res.json(await svc.dispatch(req.params.id)); } catch (e) { next(e); }
}
async function complete(req, res, next) {
  try { res.json(await svc.complete(req.params.id, req.body)); } catch (e) { next(e); }
}
async function cancel(req, res, next) {
  try { res.json(await svc.cancel(req.params.id)); } catch (e) { next(e); }
}

module.exports = { list, getOne, create, dispatch, complete, cancel };
