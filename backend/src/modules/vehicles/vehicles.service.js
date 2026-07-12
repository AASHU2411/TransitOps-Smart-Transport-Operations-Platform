const prisma = require('../../config/db');

function buildFilter({ search, status, type, region }) {
  const where = {};
  if (search) where.OR = [
    { regNo: { contains: search, mode: 'insensitive' } },
    { name:  { contains: search, mode: 'insensitive' } },
  ];
  if (status) where.status = status;
  if (type)   where.type   = type;
  if (region) where.region = { contains: region, mode: 'insensitive' };
  return where;
}

async function list(query) {
  const { page = 1, limit = 50 } = query;
  const where = buildFilter(query);
  const [data, total] = await Promise.all([
    prisma.vehicle.findMany({ where, skip: (page - 1) * limit, take: +limit, orderBy: { createdAt: 'desc' } }),
    prisma.vehicle.count({ where }),
  ]);
  return { data, total, page: +page, limit: +limit };
}

async function getById(id) {
  const v = await prisma.vehicle.findUnique({ where: { id } });
  if (!v) { const e = new Error('Vehicle not found'); e.status = 404; throw e; }
  return v;
}

async function create(data) {
  return prisma.vehicle.create({ data });
}

async function update(id, data) {
  await getById(id);
  return prisma.vehicle.update({ where: { id }, data });
}

async function remove(id) {
  const v = await getById(id);
  if (v.status === 'OnTrip') {
    const e = new Error('Cannot remove a vehicle that is currently on trip'); e.status = 409; throw e;
  }
  return prisma.vehicle.delete({ where: { id } });
}

module.exports = { list, getById, create, update, remove };
