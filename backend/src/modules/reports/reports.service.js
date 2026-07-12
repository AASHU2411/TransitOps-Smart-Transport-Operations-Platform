const prisma = require('../../config/db');
const { format } = require('@fast-csv/format');

async function kpis(query) {
  const { type, status, region } = query;
  const vehicleWhere = { status: { not: 'Retired' } };
  if (type)   vehicleWhere.type   = type;
  if (status) vehicleWhere.status = status;
  if (region) vehicleWhere.region = { contains: region, mode: 'insensitive' };

  const [
    totalVehicles, onTripVehicles, availableVehicles, inShopVehicles,
    totalDrivers, availableDrivers, suspendedDrivers,
    activeTrips, completedTrips,
    openMaintenance,
  ] = await Promise.all([
    prisma.vehicle.count({ where: vehicleWhere }),
    prisma.vehicle.count({ where: { ...vehicleWhere, status: 'OnTrip' } }),
    prisma.vehicle.count({ where: { ...vehicleWhere, status: 'Available' } }),
    prisma.vehicle.count({ where: { ...vehicleWhere, status: 'InShop' } }),
    prisma.driver.count(),
    prisma.driver.count({ where: { status: 'Available' } }),
    prisma.driver.count({ where: { status: 'Suspended' } }),
    prisma.trip.count({ where: { status: 'Dispatched' } }),
    prisma.trip.count({ where: { status: 'Completed' } }),
    prisma.maintenanceLog.count({ where: { status: 'Open' } }),
  ]);

  const utilizationPct = totalVehicles > 0
    ? Math.round((onTripVehicles / totalVehicles) * 100)
    : 0;

  return {
    vehicles: { total: totalVehicles, onTrip: onTripVehicles, available: availableVehicles, inShop: inShopVehicles, utilizationPct },
    drivers:  { total: totalDrivers, available: availableDrivers, suspended: suspendedDrivers },
    trips:    { active: activeTrips, completed: completedTrips },
    openMaintenance,
  };
}

async function compliance() {
  const today = new Date();
  const in14  = new Date(today.getTime() + 14 * 86400000);

  const [expiredLicenses, expiringSoon, suspendedDrivers, openMaintenance] = await Promise.all([
    prisma.driver.findMany({ where: { licenseExpiry: { lt: today } }, select: { id: true, name: true, licenseNumber: true, licenseExpiry: true } }),
    prisma.driver.findMany({ where: { licenseExpiry: { gte: today, lte: in14 } }, select: { id: true, name: true, licenseNumber: true, licenseExpiry: true } }),
    prisma.driver.findMany({ where: { status: 'Suspended' }, select: { id: true, name: true, status: true } }),
    prisma.maintenanceLog.findMany({ where: { status: 'Open' }, include: { vehicle: true } }),
  ]);

  return { expiredLicenses, expiringSoon, suspendedDrivers, openMaintenance };
}

async function fuelEfficiency(query) {
  const { vehicleId } = query;
  const where = { status: 'Completed', fuelConsumed: { not: null } };
  if (vehicleId) where.vehicleId = vehicleId;

  const trips = await prisma.trip.groupBy({
    by: ['vehicleId'],
    where,
    _sum: { plannedDistance: true, fuelConsumed: true },
  });

  const vehicleIds = trips.map(t => t.vehicleId);
  const vehicles = await prisma.vehicle.findMany({ where: { id: { in: vehicleIds } }, select: { id: true, name: true, regNo: true } });
  const vMap = Object.fromEntries(vehicles.map(v => [v.id, v]));

  return trips.map(t => ({
    vehicle: vMap[t.vehicleId],
    totalDistance: t._sum.plannedDistance,
    totalFuel:     Number(t._sum.fuelConsumed),
    kmPerLiter:    t._sum.fuelConsumed > 0
      ? Math.round((t._sum.plannedDistance / Number(t._sum.fuelConsumed)) * 100) / 100
      : null,
  }));
}

async function utilization() {
  const [total, onTrip] = await Promise.all([
    prisma.vehicle.count({ where: { status: { not: 'Retired' } } }),
    prisma.vehicle.count({ where: { status: 'OnTrip' } }),
  ]);
  return { total, onTrip, utilizationPct: total > 0 ? Math.round((onTrip / total) * 100) : 0 };
}

async function operationalCost(query) {
  const { vehicleId } = query;
  const where = vehicleId ? { vehicleId } : {};

  const [fuelAgg, maintAgg, expAgg] = await Promise.all([
    prisma.fuelLog.groupBy({ by: ['vehicleId'], where, _sum: { cost: true } }),
    prisma.maintenanceLog.groupBy({ by: ['vehicleId'], where, _sum: { cost: true } }),
    prisma.expense.groupBy({ by: ['vehicleId'], where, _sum: { amount: true } }),
  ]);

  const allVehicleIds = [...new Set([
    ...fuelAgg.map(r => r.vehicleId),
    ...maintAgg.map(r => r.vehicleId),
    ...expAgg.map(r => r.vehicleId),
  ])];

  const vehicles = await prisma.vehicle.findMany({
    where: { id: { in: allVehicleIds } },
    select: { id: true, name: true, regNo: true, acquisitionCost: true },
  });

  const fuelMap = Object.fromEntries(fuelAgg.map(r => [r.vehicleId, Number(r._sum.cost)]));
  const maintMap = Object.fromEntries(maintAgg.map(r => [r.vehicleId, Number(r._sum.cost)]));
  const expMap  = Object.fromEntries(expAgg.map(r => [r.vehicleId, Number(r._sum.amount)]));

  return vehicles.map(v => {
    const fuel  = fuelMap[v.id]  || 0;
    const maint = maintMap[v.id] || 0;
    const exp   = expMap[v.id]   || 0;
    return { vehicle: v, fuel, maintenance: maint, expenses: exp, total: fuel + maint + exp };
  });
}

async function roi(query) {
  const { vehicleId, ratePerKm = 15 } = query; // ratePerKm configurable via query param
  const where = { status: 'Completed' };
  if (vehicleId) where.vehicleId = vehicleId;

  const tripAgg = await prisma.trip.groupBy({
    by: ['vehicleId'],
    where,
    _sum: { plannedDistance: true },
  });

  const costs = await operationalCost(query);
  const costMap = Object.fromEntries(costs.map(c => [c.vehicle.id, c]));

  return tripAgg.map(t => {
    const revenue = t._sum.plannedDistance * Number(ratePerKm);
    const c = costMap[t.vehicleId] || { total: 0, vehicle: { id: t.vehicleId } };
    const acquisitionCost = Number(c.vehicle?.acquisitionCost || 0);
    const profit = revenue - c.total;
    const roiPct = acquisitionCost > 0 ? Math.round((profit / acquisitionCost) * 10000) / 100 : null;
    return { vehicle: c.vehicle, revenue, operationalCost: c.total, profit, acquisitionCost, roiPct };
  });
}

async function exportCsv(res, query) {
  const costs = await operationalCost(query);
  const csvStream = format({ headers: true });
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="operational-cost.csv"');
  csvStream.pipe(res);
  for (const row of costs) {
    csvStream.write({
      vehicle_id:   row.vehicle.id,
      reg_no:       row.vehicle.regNo,
      name:         row.vehicle.name,
      fuel_cost:    row.fuel,
      maintenance:  row.maintenance,
      expenses:     row.expenses,
      total_cost:   row.total,
    });
  }
  csvStream.end();
}

module.exports = { kpis, compliance, fuelEfficiency, utilization, operationalCost, roi, exportCsv };
