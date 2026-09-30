import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';
import { PrismaService } from './../src/prisma/prisma.service.js';
import * as bcrypt from 'bcrypt';
import { Role, VendorStatus } from '@prisma/client';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('EligibilityController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokenMarketing: string;
  let requirementId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    
    prisma = app.get<PrismaService>(PrismaService);
    
    const passwordHash = await bcrypt.hash('password123', 10);

    const marketing = await prisma.user.upsert({
      where: { email: 'marketing-elg-e2e@test.local' },
      update: { passwordHash, role: Role.MARKETING_USER },
      create: {
        firstName: 'Marketing', lastName: 'ElgTest', email: 'marketing-elg-e2e@test.local',
        passwordHash, role: Role.MARKETING_USER,
      },
    });

    const resMarketing = await request(app.getHttpServer()).post('/api/auth/login').send({ email: 'marketing-elg-e2e@test.local', password: 'password123' }).expect(201);
    tokenMarketing = resMarketing.body.data.accessToken;

    const req = await prisma.requirement.create({
      data: {
        requirementNumber: 'REQ-ELG-001',
        customerName: 'Test',
        customerCompany: 'Test',
        pickupLocation: 'Chennai',
        deliveryLocation: 'Bangalore',
        cargoType: 'INDUSTRIAL',
        cargoWeight: 20,
        cargoWeightUnit: 'TON',
        vehicleType: 'TRAILER',
        pickupDate: new Date(),
        createdById: marketing.id,
      }
    });
    requirementId = req.id;

    // Create a mock vendor
    await prisma.vendor.create({
      data: {
        vendorCode: 'VEN-ELG-001',
        companyName: 'Eligible Vendor',
        contactPersonName: 'Contact',
        primaryPhone: '+919999999901',
        status: VendorStatus.ACTIVE,
        createdById: marketing.id,
        serviceRegions: {
          create: [{ city: 'Chennai', regionType: 'PICKUP' }, { city: 'Bangalore', regionType: 'DELIVERY' }]
        },
        vehicleCapabilities: {
          create: [{ vehicleType: 'TRAILER', maximumCapacity: 25, capacityUnit: 'TON' }]
        },
        cargoCapabilities: {
          create: [{ cargoType: 'INDUSTRIAL' }]
        },
        availabilities: {
          create: [{ availabilityStatus: 'AVAILABLE' }]
        }
      }
    });

    await prisma.vendor.create({
      data: {
        vendorCode: 'VEN-ELG-002',
        companyName: 'Ineligible Vendor',
        contactPersonName: 'Contact',
        primaryPhone: '+919999999902',
        status: VendorStatus.ACTIVE,
        createdById: marketing.id,
        serviceRegions: {
          create: [{ city: 'Chennai', regionType: 'PICKUP' }, { city: 'Bangalore', regionType: 'DELIVERY' }]
        },
        vehicleCapabilities: {
          create: [{ vehicleType: 'TRAILER', maximumCapacity: 15, capacityUnit: 'TON' }] // Too small
        },
        cargoCapabilities: {
          create: [{ cargoType: 'INDUSTRIAL' }]
        },
      }
    });
  });

  afterAll(async () => {
    await prisma.vendorEligibilityEvaluation.deleteMany({ where: { requirementId } });
    await prisma.vendorEligibilityRun.deleteMany({ where: { requirementId } });
    await prisma.vendor.deleteMany({ where: { vendorCode: { startsWith: 'VEN-ELG-' } } });
    await prisma.requirement.deleteMany({ where: { id: requirementId } });
    await app.close();
  });

  it('/api/eligibility/evaluate (POST) - create evaluation run', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/eligibility/evaluate')
      .set('Authorization', `Bearer ${tokenMarketing}`)
      .send({ requirementId })
      .expect(201);
      
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalVendors).toBeGreaterThanOrEqual(2);
    // At least 1 eligible and 1 ineligible (from our test data)
    expect(res.body.data.eligibleCount).toBeGreaterThanOrEqual(1);
    expect(res.body.data.ineligibleCount).toBeGreaterThanOrEqual(1);
  });

  it('/api/requirements/:id/eligibility/summary (GET) - get summary', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/requirements/${requirementId}/eligibility/summary`)
      .set('Authorization', `Bearer ${tokenMarketing}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.requirementId).toBe(requirementId);
  });

  it('/api/requirements/:id/eligibility (GET) - get evaluations list', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/requirements/${requirementId}/eligibility`)
      .set('Authorization', `Bearer ${tokenMarketing}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    
    // Find the ineligible one to check its properties
    const ineligible = res.body.data.find((e: any) => e.status === 'FAILED');
    expect(ineligible).toBeDefined();
    expect(ineligible.ruleResults).toBeDefined();
  });
});
