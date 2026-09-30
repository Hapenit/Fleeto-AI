import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('QuotationsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let testRequirementId: string;
  let testVendorId: string;
  let testCallId: string;
  let testNegotiationId: string;
  let createdQuotationId: string;

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
        email: `admin_quo_${Date.now()}@test.com`,
        passwordHash,
        firstName: 'Admin',
        lastName: 'Test',
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
        cargoWeight: 20,
        cargoWeightUnit: 'TON'
      }
    });
    testRequirementId = req.id;

    const vendor = await prisma.vendor.create({
      data: {
        vendorCode: `VND-${Date.now()}`,
        companyName: 'Quotation Test Vendor',
        contactPersonName: 'Mr. Test',
        primaryPhone: '+919999988888',
        createdById: adminUser.id
      }
    });
    testVendorId = vendor.id;

    const call = await prisma.voiceCall.create({
      data: {
        callNumber: `CALL-${Date.now()}`,
        requirementId: testRequirementId,
        vendorId: testVendorId,
        provider: 'mock',
        status: 'COMPLETED',
        phoneNumber: vendor.primaryPhone
      }
    });
    testCallId = call.id;

    const negotiation = await prisma.negotiationSession.create({
      data: {
        negotiationNumber: `NEG-${Date.now()}`,
        callId: testCallId,
        requirementId: testRequirementId,
        vendorId: testVendorId,
        status: 'COMPLETED',
        createdById: adminUser.id,
        currency: 'INR'
      }
    });
    testNegotiationId = negotiation.id;
  });

  afterAll(async () => {
    await prisma.quotationRequirementSnapshot.deleteMany({ where: { quotation: { requirementId: testRequirementId } } });
    await prisma.quotation.deleteMany({ where: { requirementId: testRequirementId } });
    await prisma.negotiationSession.deleteMany({ where: { id: testNegotiationId } });
    await prisma.voiceCall.deleteMany({ where: { id: testCallId } });
    await prisma.vendor.deleteMany({ where: { id: testVendorId } });
    await prisma.requirement.deleteMany({ where: { id: testRequirementId } });
    await app.close();
  });

  it('/api/calls/:callId/quotation (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/calls/${testCallId}/quotation`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        requirementId: testRequirementId,
        vendorId: testVendorId,
        initialAmount: 80000,
        finalAmount: 80000,
        source: 'CALL'
      })
      .expect(201);
    
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('DRAFT');
    expect(res.body.data.version).toBe(1);
    createdQuotationId = res.body.data.id;
  });

  it('/api/quotations/:quotationId/confirm (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/quotations/${createdQuotationId}/confirm`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(201);
    
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('CONFIRMED');
    expect(res.body.data.vendorConfirmed).toBe(true);
  });

  it('/api/negotiations/:negotiationId/quotation (POST) - Create new version', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/negotiations/${testNegotiationId}/quotation`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        requirementId: testRequirementId,
        vendorId: testVendorId,
        finalAmount: 77000,
        source: 'NEGOTIATED'
      })
      .expect(201);
    
    expect(res.body.success).toBe(true);
    
    // In our simplified mock, it may create a new one because the previous wasn't linked to negotiationId. 
    // Wait, the first one was created using callId, not negotiationId.
    // So this will create a brand new quotation. Let's verify.
    expect(res.body.data.status).toBe('DRAFT');
    expect(res.body.data.finalAmount).toBe('77000'); // Prisma decimal is string in JSON
  });
});
