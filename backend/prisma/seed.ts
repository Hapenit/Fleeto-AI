import { PrismaClient, Role, Status, RequirementStatus, CargoWeightUnit, QuantityUnit, BudgetCurrency, RequirementSource } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = process.env.ADMIN_PASSWORD || 'password123';
  const marketingPassword = process.env.MARKETING_PASSWORD || 'password123';

  const adminHash = await bcrypt.hash(adminPassword, 10);
  const marketingHash = await bcrypt.hash(marketingPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@procurement-poc.local' },
    update: {},
    create: {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@procurement-poc.local',
      passwordHash: adminHash,
      role: Role.ADMIN,
      status: Status.ACTIVE,
    },
  });

  const marketing = await prisma.user.upsert({
    where: { email: 'marketing@procurement-poc.local' },
    update: {},
    create: {
      firstName: 'Marketing',
      lastName: 'User',
      email: 'marketing@procurement-poc.local',
      passwordHash: marketingHash,
      role: Role.MARKETING_USER,
      status: Status.ACTIVE,
    },
  });

  console.log('Seeded Users:', { admin: admin.email, marketing: marketing.email });

  // Seed Requirements
  const count = await prisma.requirement.count();
  if (count === 0) {
    const demoCustomers = [
      { name: 'ABC Industrial Solutions', company: 'ABC Industrial Solutions', loc: 'Chennai', dest: 'Bangalore' },
      { name: 'Chennai Machinery Works', company: 'Chennai Machinery Works', loc: 'Chennai', dest: 'Hyderabad' },
      { name: 'Southline Manufacturing', company: 'Southline Manufacturing', loc: 'Coimbatore', dest: 'Chennai' },
      { name: 'Demo Logistics Pvt Ltd', company: 'Demo Logistics Pvt Ltd', loc: 'Mumbai', dest: 'Pune' },
    ];

    const statuses = Object.values(RequirementStatus);
    
    for (let i = 0; i < 10; i++) {
      const cust = demoCustomers[i % demoCustomers.length];
      const reqNumber = `REQ-2026-${String(i + 1).padStart(6, '0')}`;
      const status = statuses[i % statuses.length];
      
      const r = await prisma.requirement.create({
        data: {
          requirementNumber: reqNumber,
          customerName: cust.name,
          customerCompany: cust.company,
          pickupLocation: cust.loc,
          deliveryLocation: cust.dest,
          cargoType: 'Industrial Equipment',
          cargoWeight: 10 + i,
          cargoWeightUnit: CargoWeightUnit.TON,
          vehicleType: i % 2 === 0 ? 'TRAILER' : 'TRUCK',
          pickupDate: new Date(`2026-10-${String((i % 28) + 1).padStart(2, '0')}T10:00:00Z`),
          budget: 50000 + (i * 1000),
          budgetCurrency: BudgetCurrency.INR,
          status: status,
          createdById: marketing.id,
          source: RequirementSource.MANUAL,
        }
      });
      
      await prisma.requirementStatusHistory.create({
        data: {
          requirementId: r.id,
          toStatus: status,
          changedById: marketing.id,
          reason: 'Seeded status'
        }
      });
    }
    console.log('Seeded 10 Demo Requirements');
  }

  // Seed Vendors
  const vendorCount = await prisma.vendor.count();
  if (vendorCount === 0) {
    const cities = ['Chennai', 'Bangalore', 'Hosur', 'Coimbatore', 'Madurai', 'Salem', 'Hyderabad', 'Pune', 'Mumbai'];
    const vTypes = ['Trailer', 'Container Truck', 'Heavy Truck', 'Flatbed', 'Lowbed', 'Tanker'];
    const caps = [5, 10, 15, 20, 25, 30, 40];
    const cTypes = ['Industrial', 'Machinery', 'General Cargo', 'FMCG', 'Electronics'];

    for (let i = 1; i <= 35; i++) {
      const vcode = `VEN-2026-${String(i).padStart(6, '0')}`;
      const city = cities[i % cities.length];
      
      await prisma.vendor.create({
        data: {
          vendorCode: vcode,
          companyName: `Demo Logistics ${String(i).padStart(2, '0')}`,
          businessName: `Demo Logistics ${String(i).padStart(2, '0')}`,
          contactPersonName: `Demo Contact ${i}`,
          primaryPhone: `+9198765${String(i).padStart(5, '0')}`,
          preferredLanguage: i % 3 === 0 ? 'TA' : (i % 2 === 0 ? 'TA_EN' : 'EN'),
          status: i % 5 === 0 ? 'INACTIVE' : 'ACTIVE',
          callEnabled: true,
          createdById: admin.id,
          locations: {
            create: [
              { city, locationType: 'OFFICE', isPrimary: true },
              { city: cities[(i + 1) % cities.length], locationType: 'DEPOT' }
            ]
          },
          serviceRegions: {
            create: [
              { city, regionType: 'PICKUP' },
              { city: cities[(i + 2) % cities.length], regionType: 'DELIVERY' }
            ]
          },
          vehicleCapabilities: {
            create: [
              { vehicleType: vTypes[i % vTypes.length], maximumCapacity: caps[i % caps.length], capacityUnit: 'TON', isPrimary: true }
            ]
          },
          cargoCapabilities: {
            create: [
              { cargoType: cTypes[i % cTypes.length], maximumWeight: caps[i % caps.length], weightUnit: 'TON' }
            ]
          },
          availabilities: {
            create: [
              { availabilityStatus: 'AVAILABLE' }
            ]
          },
          performance: {
            create: { totalTrips: i * 5, successfulTrips: (i * 5) - 1, averageResponseTimeMinutes: 15 + i }
          }
        }
      });
    }
    console.log('Seeded 35 Demo Vendors');
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
