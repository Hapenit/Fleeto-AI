import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('QuotationComparisonController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let testRequirementId: string;
  let testVendorId1: string;
  let testVendorId2: string;
  let createdComparisonId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    const passwordHash = await bcrypt.hash('password123', 10);
    const adminUser = await prisma.user.create({
      data: {
        email: `admin_comp_${Date.now()}@test.com`,
        passwordHash,
        firstName: 'Admin',
        lastName: 'CompTest',
        role: 'ADMIN',
      }
    });

    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: adminUser.email, password: 'password123' })
      .expect(201);
    authToken = loginRes.body.data.accessToken;

    const req = await prisma.requirement.create({
      data: {
        requirementNumber: `REQ-${Date.now()}`,
        pickupCity: 'Chennai',
        deliveryCity: 'Bangalore',
        createdById: adminUser.id,
        status: 'DRAFT',
        vehicleType: 'Trailer'
      }
    });
    testRequirementId = req.id;

    const vendor1 = await prisma.vendor.create({
      data: {
        vendorCode: `VND1-${Date.now()}`,
        companyName: 'Vendor 1',
        contactPersonName: 'Test',
        primaryPhone: '+919999988881',
        createdById: adminUser.id
      }
    });
    testVendorId1 = vendor1.id;

    const vendor2 = await prisma.vendor.create({
      data: {
        vendorCode: `VND2-${Date.now()}`,
        companyName: 'Vendor 2',
        contactPersonName: 'Test',
        primaryPhone: '+919999988882',
        createdById: adminUser.id
      }
    });
    testVendorId2 = vendor2.id;

    // Create quotation for vendor 1
    const q1 = await prisma.quotation.create({
      data: {
        quotationNumber: `QUO-V1-${Date.now()}`,
        requirementId: testRequirementId,
        vendorId: testVendorId1,
        initialAmount: 77000,
        finalAmount: 77000,
        status: 'CONFIRMED',
        vendorConfirmed: true,
        createdById: adminUser.id,
        updatedById: adminUser.id,
      }
    });

    await prisma.quotationCharge.create({
      data: {
        quotationId: q1.id,
        type: 'TOLL',
        amount: 3000,
        status: 'EXTRA',
      }
    });

    // Create quotation for vendor 2
    const q2 = await prisma.quotation.create({
      data: {
        quotationNumber: `QUO-V2-${Date.now()}`,
        requirementId: testRequirementId,
        vendorId: testVendorId2,
        initialAmount: 76000,
        finalAmount: 76000,
        status: 'CONFIRMED',
        vendorConfirmed: true,
        createdById: adminUser.id,
        updatedById: adminUser.id,
      }
    });

    await prisma.quotationRequirementSnapshot.create({
      data: {
        quotationId: q2.id,
        pickupLocation: 'Chennai',
        deliveryLocation: 'Bangalore',
        cargoType: 'Unknown',
        cargoWeight: 0,
        cargoWeightUnit: 'TON',
        vehicleType: 'Container Truck', // Mismatch!
      }
    });

  });

  afterAll(async () => {
    await prisma.requirementMismatch.deleteMany({ where: { item: { comparison: { requirementId: testRequirementId } } } });
    await prisma.quotationComparisonItem.deleteMany({ where: { comparison: { requirementId: testRequirementId } } });
    await prisma.quotationComparison.deleteMany({ where: { requirementId: testRequirementId } });
    await prisma.quotationCharge.deleteMany({ where: { quotation: { requirementId: testRequirementId } } });
    await prisma.quotationRequirementSnapshot.deleteMany({ where: { quotation: { requirementId: testRequirementId } } });
    await prisma.quotation.deleteMany({ where: { requirementId: testRequirementId } });
    await prisma.vendor.deleteMany({ where: { id: { in: [testVendorId1, testVendorId2] } } });
    await prisma.requirement.deleteMany({ where: { id: testRequirementId } });
    await app.close();
  });

  it('/api/requirements/:requirementId/comparison (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/requirements/${testRequirementId}/comparison`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(201);
    
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('READY');
    expect(res.body.data.items.length).toBe(2);

    const v1Item = res.body.data.items.find((i: any) => i.vendorId === testVendorId1);
    const v2Item = res.body.data.items.find((i: any) => i.vendorId === testVendorId2);

    // Vendor 1 has 77000 base + 3000 extra toll
    expect(v1Item.finalAmount).toBe('77000');
    expect(v1Item.knownAdditionalChargesAmount).toBe('3000');
    expect(v1Item.knownTotalAmount).toBe('80000');
    expect(v1Item.mismatches.length).toBe(0);

    // Vendor 2 has 76000 base + 0 extra + Vehicle mismatch
    expect(v2Item.finalAmount).toBe('76000');
    expect(v2Item.mismatches.length).toBe(1);
    expect(v2Item.mismatches[0].type).toBe('VEHICLE_TYPE');
  });
});
