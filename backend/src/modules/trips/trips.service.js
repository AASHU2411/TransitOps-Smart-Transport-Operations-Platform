const prisma = require('../../config/db');

function buildFilter({ search, status, vehicleId, driverId }) {
  const where = {};
  if (search) where.OR = [
    { source:      { contains: search, mode: 'insensitive' } },
    { destination: { contains: search, mode: 'insensitive' } },
  ];
  if (status)    where.status    = status;
  if (vehicleId) where.vehicleId = vehicleId;
  if (driverId)  where.driverId  = driverId;
  return where;
}

async function list(query) {
  const { page = 1, limit = 50 } = query;
  const where = buildFilter(query);
  const [data, total] = await Promise.all([
    prisma.trip.findMany({
      where, skip: (page - 1) * limit, take: +limit,
      orderBy: { createdAt: 'desc' },
      include: { vehicle: true, driver: true },
    }),
    prisma.trip.count({ where }),
  ]);
  return { data, total, page: +page, limit: +limit };
}

async function getById(id) {
  const t = await prisma.trip.findUnique({
    where: { id },
    include: { vehicle: true, driver: true },
  });
  if (!t) { const e = new Error('Trip not found'); e.status = 404; throw e; }
  return t;
}

async function create(data, userId) {
  const [vehicle, driver] = await Promise.all([
    prisma.vehicle.findUnique({ where: { id: data.vehicleId } }),
    prisma.driver.findUnique({ where: { id: data.driverId } }),
  ]);

  if (!vehicle) { const e = new Error('Vehicle not found'); e.status = 404; throw e; }
  if (!driver)  { const e = new Error('Driver not found');  e.status = 404; throw e; }

  if (vehicle.status !== 'Available') {
    const e = new Error(`Vehicle is not available (status: ${vehicle.status})`); e.status = 422; throw e;
  }
  if (driver.status !== 'Available') {
    const e = new Error(`Driver is not available (status: ${driver.status})`); e.status = 422; throw e;
  }
  if (new Date(driver.licenseExpiry) < new Date()) {
    const e = new Error('Driver license is expired'); e.status = 422; throw e;
  }
  if (data.cargoWeight > vehicle.maxLoad) {
    const e = new Error(`Cargo weight ${data.cargoWeight}kg exceeds vehicle max load ${vehicle.maxLoad}kg`); e.status = 422; throw e;
  }

  return prisma.trip.create({
    data: { ...data, createdById: userId, status: 'Draft' },
    include: { vehicle: true, driver: true },
  });
}

async function dispatch(id) {
  // Use transaction with row-level lock to prevent double-booking
  return prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({ where: { id } });
    if (!trip) { const e = new Error('Trip not found'); e.status = 404; throw e; }
    if (trip.status !== 'Draft') {
      const e = new Error(`Cannot dispatch a trip with status: ${trip.status}`); e.status = 422; throw e;
    }

    // Lock vehicle and driver rows
    const [vehicle, driver] = await Promise.all([
      tx.vehicle.findUnique({ where: { id: trip.vehicleId } }),
      tx.driver.findUnique({ where: { id: trip.driverId } }),
    ]);

    if (vehicle.status !== 'Available') {
      const e = new Error(`Vehicle is not available (status: ${vehicle.status})`); e.status = 422; throw e;
    }
    if (driver.status !== 'Available') {
      const e = new Error(`Driver is not available (status: ${driver.status})`); e.status = 422; throw e;
    }
    if (new Date(driver.licenseExpiry) < new Date()) {
      const e = new Error('Driver license is expired'); e.status = 422; throw e;
    }
    if (trip.cargoWeight > vehicle.maxLoad) {
      const e = new Error('Cargo weight exceeds vehicle max load'); e.status = 422; throw e;
    }

    const [updatedTrip] = await Promise.all([
      tx.trip.update({
        where: { id },
        data: { status: 'Dispatched', dispatchedAt: new Date() },
        include: { vehicle: true, driver: true },
      }),
      tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: 'OnTrip' } }),
      tx.driver.update({ where: { id: trip.driverId },  data: { status: 'OnTrip' } }),
    ]);
    return updatedTrip;
  });
}

async function complete(id, { finalOdometer, fuelConsumed }) {
  return prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({ where: { id } });
    if (!trip) { const e = new Error('Trip not found'); e.status = 404; throw e; }
    if (trip.status !== 'Dispatched') {
      const e = new Error(`Cannot complete a trip with status: ${trip.status}`); e.status = 422; throw e;
    }

    const [updatedTrip] = await Promise.all([
      tx.trip.update({
        where: { id },
        data: { status: 'Completed', completedAt: new Date(), finalOdometer, fuelConsumed },
        include: { vehicle: true, driver: true },
      }),
      tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: 'Available', odometer: finalOdometer } }),
      tx.driver.update({ where: { id: trip.driverId },  data: { status: 'Available' } }),
    ]);
    return updatedTrip;
  });
}

async function cancel(id) {
  return prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({ where: { id } });
    if (!trip) { const e = new Error('Trip not found'); e.status = 404; throw e; }
    if (!['Draft', 'Dispatched'].includes(trip.status)) {
      const e = new Error(`Cannot cancel a trip with status: ${trip.status}`); e.status = 422; throw e;
    }

    const updates = [
      tx.trip.update({ where: { id }, data: { status: 'Cancelled' }, include: { vehicle: true, driver: true } }),
    ];

    // Only restore statuses if the trip was already dispatched
    if (trip.status === 'Dispatched') {
      updates.push(tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: 'Available' } }));
      updates.push(tx.driver.update({ where: { id: trip.driverId },  data: { status: 'Available' } }));
    }

    const [updatedTrip] = await Promise.all(updates);
    return updatedTrip;
  });
}

module.exports = { list, getById, create, dispatch, complete, cancel };
