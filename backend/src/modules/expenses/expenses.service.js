const prisma = require('../../config/db');

async function list(query) {
  const { page = 1, limit = 50, vehicleId, type } = query;
  const where = {};
  if (vehicleId) where.vehicleId = vehicleId;
  if (type)      where.type      = type;
  const [data, total] = await Promise.all([
    prisma.expense.findMany({
      where, skip: (page - 1) * limit, take: +limit,
      orderBy: { date: 'desc' },
      include: { vehicle: true },
    }),
    prisma.expense.count({ where }),
  ]);
  return { data, total, page: +page, limit: +limit };
}

async function create(data) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
  if (!vehicle) { const e = new Error('Vehicle not found'); e.status = 404; throw e; }
  return prisma.expense.create({
    data: { ...data, date: new Date(data.date) },
    include: { vehicle: true },
  });
}

module.exports = { list, create };
