const prisma = require('../../config/db');

function buildFilter({ vehicleId, status, type }) {
  const where = {};
  if (vehicleId) where.vehicleId = vehicleId;
  if (status)    where.status    = status;
  if (type)      where.type      = type;
  return where;
}

async function list(query) {
  const { page = 1, limit = 50 } = query;
  const where = buildFilter(query);
  const [data, total] = await Promise.all([
    prisma.maintenanceLog.findMany({
      where, skip: (page - 1) * limit, take: +limit,
      orderBy: { createdAt: 'desc' },
      include: { vehicle: true },
    }),
    prisma.maintenanceLog.count({ where }),
  ]);
  return { data, total, page: +page, limit: +limit };
}

async function getById(id) {
  const m = await prisma.maintenanceLog.findUnique({ where: { id }, include: { vehicle: true } });
  if (!m) { const e = new Error('Maintenance log not found'); e.status = 404; throw e; }
  return m;
}

async function create(data) {
  return prisma.$transaction(async (tx) => {
    const vehicle = await tx.vehicle.findUnique({ where: { id: data.vehicleId } });
    if (!vehicle) { const e = new Error('Vehicle not found'); e.status = 404; throw e; }
    if (vehicle.status === 'OnTrip') {
      const e = new Error('Cannot log maintenance for a vehicle currently on trip'); e.status = 422; throw e;
    }

    const [log] = await Promise.all([
      tx.maintenanceLog.create({
        data: { ...data, date: new Date(data.date), status: 'Open' },
        include: { vehicle: true },
      }),
      tx.vehicle.update({ where: { id: data.vehicleId }, data: { status: 'InShop' } }),
    ]);
    return log;
  });
}

async function close(id) {
  return prisma.$transaction(async (tx) => {
    const log = await tx.maintenanceLog.findUnique({ where: { id } });
    if (!log) { const e = new Error('Maintenance log not found'); e.status = 404; throw e; }
    if (log.status === 'Closed') {
      const e = new Error('Maintenance log is already closed'); e.status = 422; throw e;
    }

    const vehicle = await tx.vehicle.findUnique({ where: { id: log.vehicleId } });
    const updates = [
      tx.maintenanceLog.update({ where: { id }, data: { status: 'Closed' }, include: { vehicle: true } }),
    ];
    if (vehicle.status !== 'Retired') {
      updates.push(tx.vehicle.update({ where: { id: log.vehicleId }, data: { status: 'Available' } }));
    }

    const [updated] = await Promise.all(updates);
    return updated;
  });
}

module.exports = { list, getById, create, close };
