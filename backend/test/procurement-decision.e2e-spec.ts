import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('ProcurementDecisionController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let adminUserId: string;
  let testRequirementId: string;
  let testVendorId: string;
  let testQuotationId: string;
  let createdDecisionId: string;
  let comparisonId: string;

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
        email: `admin_proc_${Date.now()}@test.com`,
        passwordHash,
        firstName: 'Admin',
        lastName: 'ProcTest',
        role: 'ADMIN',
      }
    });
    adminUserId = adminUser.id;

    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: adminUser.email, password: 'password123' })
      .expect(201);
    authToken = loginRes.body.data.accessToken;

    const req = await prisma.requirement.create({
      data: {
        requirementNumber: `REQ-PROC-${Date.now()}`,
        pickupCity: 'Chennai',
        deliveryCity: 'Bangalore',
        createdById: adminUserId,
        status: 'UNDER_REVIEW',
        vehicleType: 'Trailer'
      }
    });
    testRequirementId = req.id;

    const vendor = await prisma.vendor.create({
      data: {
        vendorCode: `VND-PROC-${Date.now()}`,
        companyName: 'Vendor Proc',
        contactPersonName: 'Test',
        primaryPhone: '+919999988899',
        createdById: adminUserId
      }
    });
    testVendorId = vendor.id;

    const q = await prisma.quotation.create({
      data: {
        quotationNumber: `QUO-PROC-${Date.now()}`,
        requirementId: testRequirementId,
        vendorId: testVendorId,
        initialAmount: 77000,
        finalAmount: 77000,
        status: 'CONFIRMED',
        vendorConfirmed: true,
        createdById: adminUserId,
        updatedById: adminUserId,
      }
    });
    testQuotationId = q.id;

    const comp = await prisma.quotationComparison.create({
      data: {
        comparisonNumber: `CMP-PROC-${Date.now()}`,
        requirementId: testRequirementId,
        status: 'READY',
        createdById: adminUserId,
      }
    });
    comparisonId = comp.id;

    await prisma.quotationComparisonItem.create({
      data: {
        comparisonId: comp.id,
        quotationId: testQuotationId,
        vendorId: testVendorId,
        finalAmount: 77000,
      }
    });
  });

  afterAll(async () => {
    await prisma.procurementDecisionAudit.deleteMany({ where: { decision: { requirementId: testRequirementId } } });
    await prisma.procurementDecisionItem.deleteMany({ where: { decision: { requirementId: testRequirementId } } });
    await prisma.procurementDecision.deleteMany({ where: { requirementId: testRequirementId } });
    await prisma.quotationComparisonItem.deleteMany({ where: { comparison: { requirementId: testRequirementId } } });
    await prisma.quotationComparison.deleteMany({ where: { requirementId: testRequirementId } });
    await prisma.quotation.deleteMany({ where: { requirementId: testRequirementId } });
    await prisma.vendor.deleteMany({ where: { id: testVendorId } });
    await prisma.requirementStatusHistory.deleteMany({ where: { requirementId: testRequirementId } });
    await prisma.requirement.deleteMany({ where: { id: testRequirementId } });
    await prisma.user.deleteMany({ where: { id: adminUserId } });
    await app.close();
  });

  it('/api/requirements/:requirementId/procurement/decision (POST) - Create workspace', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/requirements/${testRequirementId}/procurement/decision`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(201);
    
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('PENDING_DECISION');
    createdDecisionId = res.body.data.id;
  });

  it('/api/procurement-decisions/:decisionId/confirm (POST) - Confirm selection', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/procurement-decisions/${createdDecisionId}/confirm`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        quotationId: testQuotationId,
        version: 1,
        reason: 'Selected for best delivery performance.',
        notes: 'Customer confirmed'
      })
      .expect(201);
    
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('CONFIRMED');
    expect(res.body.data.selectedQuotationId).toBe(testQuotationId);

    // Verify Requirement Status
    const req = await prisma.requirement.findUnique({ where: { id: testRequirementId } });
    expect(req?.status).toBe('VENDOR_SELECTED');

    // Verify Quotation Status
    const q = await prisma.quotation.findUnique({ where: { id: testQuotationId } });
    expect(q?.status).toBe('SELECTED');
  });
});
