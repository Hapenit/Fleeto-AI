import { Test, TestingModule } from '@nestjs/testing';
import { VendorsService } from './vendors.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { VendorStatus, Role, VendorLanguage } from '@prisma/client';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

describe('VendorsService', () => {
  let service: VendorsService;
  let prismaService: any;
  let auditService: any;

  beforeEach(async () => {
    prismaService = {
      vendor: {
        findFirst: vi.fn(),
        create: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    };

    auditService = {
      createLog: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VendorsService,
        { provide: PrismaService, useValue: prismaService },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<VendorsService>(VendorsService);
  });

  describe('create', () => {
    it('should create a new vendor successfully', async () => {
      prismaService.vendor.findFirst.mockResolvedValueOnce(null); // No existing phone
      prismaService.vendor.findFirst.mockResolvedValueOnce(null); // Code generation
      
      const createdVendor = { id: 'v1', vendorCode: 'VEN-2026-000001', companyName: 'Test' };
      prismaService.vendor.create.mockResolvedValue(createdVendor);

      const res = await service.create({
        companyName: 'Test',
        contactPersonName: 'Contact',
        primaryPhone: '+919876543210'
      }, 'u1', 'ip', 'ua');

      expect(res).toEqual(createdVendor);
      expect(auditService.createLog).toHaveBeenCalled();
    });

    it('should throw BadRequestException if phone already exists', async () => {
      prismaService.vendor.findFirst.mockResolvedValue({ id: 'v1', primaryPhone: '+919876543210' });
      
      await expect(service.create({
        companyName: 'Test',
        contactPersonName: 'Contact',
        primaryPhone: '+919876543210'
      }, 'u1', 'ip', 'ua')).rejects.toThrow(BadRequestException);
    });
  });

  describe('changeStatus', () => {
    it('should update status to ACTIVE', async () => {
      prismaService.vendor.findUnique.mockResolvedValue({ id: 'v1', status: VendorStatus.PENDING_VERIFICATION });
      prismaService.vendor.update.mockResolvedValue({ id: 'v1', status: VendorStatus.ACTIVE });

      const res = await service.changeStatus('v1', { status: VendorStatus.ACTIVE }, 'u1', Role.MARKETING_USER, 'ip', 'ua');
      expect(res.status).toBe(VendorStatus.ACTIVE);
    });

    it('should throw ForbiddenException when MARKETING_USER tries to SUSPEND', async () => {
      prismaService.vendor.findUnique.mockResolvedValue({ id: 'v1', status: VendorStatus.ACTIVE });
      
      await expect(service.changeStatus('v1', { status: VendorStatus.SUSPENDED }, 'u1', Role.MARKETING_USER, 'ip', 'ua'))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should deactivate vendor if user is ADMIN', async () => {
      prismaService.vendor.findUnique.mockResolvedValue({ id: 'v1' });
      prismaService.vendor.update.mockResolvedValue({ id: 'v1', status: VendorStatus.INACTIVE });

      const res = await service.remove('v1', 'u1', Role.ADMIN, 'ip', 'ua');
      expect(res.status).toBe(VendorStatus.INACTIVE);
    });

    it('should throw ForbiddenException if user is not ADMIN', async () => {
      await expect(service.remove('v1', 'u1', Role.MARKETING_USER, 'ip', 'ua'))
        .rejects.toThrow(ForbiddenException);
    });
  });
});
