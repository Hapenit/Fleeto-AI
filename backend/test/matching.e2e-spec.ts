import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';
import { PrismaService } from './../src/prisma/prisma.service.js';
import * as bcrypt from 'bcrypt';
import { Role, VendorStatus, EvaluationStatus } from '@prisma/client';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('MatchingController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokenMarketing: string;
  let requirementId: string;
  let vendor1Id: string;
  let vendor2Id: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    
    prisma = app.get<PrismaService>(PrismaService);
    
    const passwordHash = await bcrypt.hash('password123', 10);

    const marketing = await prisma.user.upsert({
      where: { email: 'marketing-match-e2e@test.local' },
      update: { passwordHash, role: Role.MARKETING_USER },
      create: {
        firstName: 'Marketing', lastName: 'MatchTest', email: 'marketing-match-e2e@test.local',
        passwordHash, role: Role.MARKETING_USER,
      },
    });

    const resMarketing = await request(app.getHttpServer()).post('/api/auth/login').send({ email: 'marketing-match-e2e@test.local', password: 'password123' }).expect(201);
    tokenMarketing = resMarketing.body.data.accessToken;

    const req = await prisma.requirement.create({
      data: {
        requirementNumber: 'REQ-MATCH-001',
        customerName: 'Test Match',
        customerCompany: 'Test Match',
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

    // Create 2 vendors
    const v1 = await prisma.vendor.create({
      data: {
        vendorCode: 'VEN-MATCH-001', companyName: 'Match Vendor 1', contactPersonName: 'Contact 1', primaryPhone: '+918888888801', status: VendorStatus.ACTIVE, createdById: marketing.id,
        locations: { create: [{ city: 'Chennai' }, { city: 'Bangalore' }] },
        serviceRegions: { create: [{ city: 'Chennai', regionType: 'PICKUP' }, { city: 'Bangalore', regionType: 'DELIVERY' }] },
        vehicleCapabilities: { create: [{ vehicleType: 'TRAILER', maximumCapacity: 20, capacityUnit: 'TON' }] }, // perfect capacity match
        cargoCapabilities: { create: [{ cargoType: 'INDUSTRIAL' }] },
        availabilities: { create: [{ availabilityStatus: 'AVAILABLE' }] },
        performance: { create: { totalTrips: 10, successfulTrips: 10 } }
      }
    });
    vendor1Id = v1.id;

    const v2 = await prisma.vendor.create({
      data: {
        vendorCode: 'VEN-MATCH-002', companyName: 'Match Vendor 2', contactPersonName: 'Contact 2', primaryPhone: '+918888888802', status: VendorStatus.ACTIVE, createdById: marketing.id,
        locations: { create: [{ city: 'Chennai' }] }, // missing bangalore location
        serviceRegions: { create: [{ city: 'Chennai', regionType: 'PICKUP' }, { city: 'Bangalore', regionType: 'DELIVERY' }] },
        vehicleCapabilities: { create: [{ vehicleType: 'TRAILER', maximumCapacity: 40, capacityUnit: 'TON' }] }, // double capacity
        cargoCapabilities: { create: [{ cargoType: 'INDUSTRIAL' }] },
        availabilities: { create: [{ availabilityStatus: 'AVAILABLE' }] },
        performance: { create: { totalTrips: 10, successfulTrips: 8 } } // worse performance
      }
    });
    vendor2Id = v2.id;

    // Create a mock eligibility evaluation so matching has something to rank
    const elgRun = await prisma.vendorEligibilityRun.create({
      data: { runNumber: 'ELG-MATCH-TEST', requirementId, engineVersion: '1.0', createdById: marketing.id, status: 'COMPLETED' }
    });

    await prisma.vendorEligibilityEvaluation.createMany({
      data: [
        { evaluationNumber: 'ELG-E-V1', runId: elgRun.id, requirementId, vendorId: vendor1Id, status: EvaluationStatus.COMPLETED, eligible: true, engineVersion: '1.0' },
        { evaluationNumber: 'ELG-E-V2', runId: elgRun.id, requirementId, vendorId: vendor2Id, status: EvaluationStatus.COMPLETED, eligible: true, engineVersion: '1.0' },
      ]
    });
  });

  afterAll(async () => {
    await prisma.vendorOutreachSelection.deleteMany({ where: { requirementId } });
    await prisma.vendorRankingEvaluation.deleteMany({ where: { requirementId } });
    await prisma.vendorRankingRun.deleteMany({ where: { requirementId } });
    await prisma.vendorEligibilityEvaluation.deleteMany({ where: { requirementId } });
    await prisma.vendorEligibilityRun.deleteMany({ where: { requirementId } });
    await prisma.vendor.deleteMany({ where: { vendorCode: { startsWith: 'VEN-MATCH-' } } });
    await prisma.requirement.deleteMany({ where: { id: requirementId } });
    await app.close();
  });

  it('/api/matching/rank (POST) - create ranking', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/matching/rank')
      .set('Authorization', `Bearer ${tokenMarketing}`)
      .send({ requirementId })
      .expect(201);
      
    expect(res.body.success).toBe(true);
    expect(res.body.data.rankedCount).toBe(2);
  });

  it('/api/requirements/:id/matching (GET) - get rankings', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/requirements/${requirementId}/matching`)
      .set('Authorization', `Bearer ${tokenMarketing}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(2);
    
    // Vendor 1 should be ranked higher due to perfect capacity, perfect locations, and perfect performance
    const rank1 = res.body.data[0];
    const rank2 = res.body.data[1];
    expect(rank1.vendorId).toBe(vendor1Id);
    expect(rank2.vendorId).toBe(vendor2Id);
    expect(rank1.score).toBeGreaterThan(rank2.score);
  });

  it('/api/requirements/:id/outreach/vendors (POST) - select vendors', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/requirements/${requirementId}/outreach/vendors`)
      .set('Authorization', `Bearer ${tokenMarketing}`)
      .send({ vendorIds: [vendor1Id] })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.selectedCount).toBe(1);
  });

  it('/api/requirements/:id/outreach/vendors (GET) - get selected vendors', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/requirements/${requirementId}/outreach/vendors`)
      .set('Authorization', `Bearer ${tokenMarketing}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].vendorId).toBe(vendor1Id);
  });
});
