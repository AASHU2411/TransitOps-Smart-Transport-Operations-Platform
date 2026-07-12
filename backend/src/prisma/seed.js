const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('demo1234', 10);

  // Users
  const fleet = await prisma.user.upsert({
    where: { email: 'fleet@transitops.io' },
    update: {},
    create: { name: 'Priya Nair', email: 'fleet@transitops.io', passwordHash: hash, role: 'FleetManager' },
  });
  await prisma.user.upsert({
    where: { email: 'driver@transitops.io' },
    update: {},
    create: { name: 'Alex Rivera', email: 'driver@transitops.io', passwordHash: hash, role: 'Driver' },
  });
  await prisma.user.upsert({
    where: { email: 'safety@transitops.io' },
    update: {},
    create: { name: 'Kabir Shah', email: 'safety@transitops.io', passwordHash: hash, role: 'SafetyOfficer' },
  });
  await prisma.user.upsert({
    where: { email: 'finance@transitops.io' },
    update: {},
    create: { name: 'Meera Iyer', email: 'finance@transitops.io', passwordHash: hash, role: 'FinancialAnalyst' },
  });

  // Vehicles
  const v1 = await prisma.vehicle.upsert({
    where: { regNo: 'RJ14-GB-4021' },
    update: {},
    create: { regNo: 'RJ14-GB-4021', name: 'Van-05 (Tata Ace)', type: 'Van', maxLoad: 500, odometer: 18420, acquisitionCost: 620000, status: 'Available', region: 'Jaipur' },
  });
  const v2 = await prisma.vehicle.upsert({
    where: { regNo: 'RJ14-GB-4022' },
    update: {},
    create: { regNo: 'RJ14-GB-4022', name: 'Truck-11 (Ashok Leyland)', type: 'Truck', maxLoad: 3200, odometer: 54210, acquisitionCost: 1850000, status: 'Available', region: 'Jaipur' },
  });
  const v3 = await prisma.vehicle.upsert({
    where: { regNo: 'RJ14-GB-4023' },
    update: {},
    create: { regNo: 'RJ14-GB-4023', name: 'Mini-Van-02', type: 'Van', maxLoad: 350, odometer: 9012, acquisitionCost: 480000, status: 'Available', region: 'Alwar' },
  });

  // Drivers
  const d1 = await prisma.driver.upsert({
    where: { licenseNumber: 'RJ-DL-88213' },
    update: {},
    create: { name: 'Alex Rivera', licenseNumber: 'RJ-DL-88213', licenseCategory: 'LMV', licenseExpiry: new Date(Date.now() + 200 * 86400000), contact: '+91 98290 11223', safetyScore: 92, status: 'Available' },
  });
  const d2 = await prisma.driver.upsert({
    where: { licenseNumber: 'RJ-DL-77120' },
    update: {},
    create: { name: 'Rohit Malhotra', licenseNumber: 'RJ-DL-77120', licenseCategory: 'HMV', licenseExpiry: new Date(Date.now() + 400 * 86400000), contact: '+91 98290 33441', safetyScore: 87, status: 'Available' },
  });

  // Fuel logs
  await prisma.fuelLog.createMany({
    data: [
      { vehicleId: v1.id, liters: 22, cost: 2178, date: new Date(Date.now() - 4 * 86400000) },
      { vehicleId: v2.id, liters: 140, cost: 13860, date: new Date(Date.now() - 1 * 86400000) },
    ],
    skipDuplicates: true,
  });

  // Maintenance
  await prisma.maintenanceLog.create({
    data: { vehicleId: v3.id, type: 'OilChange', description: 'Scheduled 10k service', cost: 4200, date: new Date(Date.now() - 1 * 86400000), status: 'Open' },
  }).catch(() => {});

  console.log('✅ Seed complete');
}

main().catch(console.error).finally(() => prisma.$disconnect());
