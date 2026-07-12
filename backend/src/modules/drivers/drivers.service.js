const prisma = require('../../config/db');

function buildFilter({ search, status, licenseCategory }) {
  const where = {};
  if (search) where.OR = [
    { name:          { contains: search, mode: 'insensitive' } },
    { licenseNumber: { contains: search, mode: 'insensitive' } },
  ];
  if (status)          where.status          = status;
  if (licenseCategory) where.licenseCategory = licenseCategory;
  return where;
}

async function list(query) {
  const { page = 1, limit = 50 } = query;
  const where = buildFilter(query);
  const [data, total] = await Promise.all([
    prisma.driver.findMany({ where, skip: (page - 1) * limit, take: +limit, orderBy: { createdAt: 'desc' } }),
    prisma.driver.count({ where }),
  ]);
  return { data, total, page: +page, limit: +limit };
}

async function getById(id) {
  const d = await prisma.driver.findUnique({ where: { id } });
  if (!d) { const e = new Error('Driver not found'); e.status = 404; throw e; }
  return d;
}

async function create(data) {
  return prisma.driver.create({
    data: { ...data, licenseExpiry: new Date(data.licenseExpiry) },
  });
}

async function update(id, data) {
  await getById(id);
  const payload = { ...data };
  if (data.licenseExpiry) payload.licenseExpiry = new Date(data.licenseExpiry);
  return prisma.driver.update({ where: { id }, data: payload });
}

async function remove(id) {
  const d = await getById(id);
  if (d.status === 'OnTrip') {
    const e = new Error('Cannot remove a driver currently on trip'); e.status = 409; throw e;
  }
  return prisma.driver.delete({ where: { id } });
}

module.exports = { list, getById, create, update, remove };
