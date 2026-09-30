import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { CreateVendorDto, UpdateVendorDto, ChangeVendorStatusDto, VendorQueryDto } from './dto/vendor.dto.js';
import { VendorStatus, Role } from '@prisma/client';

@Injectable()
export class VendorsService {
  constructor(private prisma: PrismaService, private auditService: AuditService) {}

  private async generateVendorCode(): Promise<string> {
    const latest = await this.prisma.vendor.findFirst({
      where: { vendorCode: { startsWith: `VEN-${new Date().getFullYear()}-` } },
      orderBy: { vendorCode: 'desc' },
    });
    let nextNum = 1;
    if (latest) {
      const parts = latest.vendorCode.split('-');
      if (parts.length === 3) nextNum = parseInt(parts[2], 10) + 1;
    }
    return `VEN-${new Date().getFullYear()}-${nextNum.toString().padStart(6, '0')}`;
  }

  async create(dto: CreateVendorDto, userId: string, ip: string, userAgent: string) {
    const existingPhone = await this.prisma.vendor.findFirst({ where: { primaryPhone: dto.primaryPhone } });
    if (existingPhone) {
      throw new BadRequestException('A vendor with this primary phone number already exists.');
    }

    const vendorCode = await this.generateVendorCode();

    const vendor = await this.prisma.vendor.create({
      data: {
        vendorCode,
        companyName: dto.companyName,
        businessName: dto.businessName,
        contactPersonName: dto.contactPersonName,
        primaryPhone: dto.primaryPhone,
        alternatePhone: dto.alternatePhone,
        whatsappPhone: dto.whatsappPhone,
        email: dto.email,
        preferredLanguage: dto.preferredLanguage,
        callEnabled: dto.callEnabled,
        preferredCallStartTime: dto.preferredCallStartTime,
        preferredCallEndTime: dto.preferredCallEndTime,
        timezone: dto.timezone,
        notes: dto.notes,
        createdById: userId,
        status: VendorStatus.PENDING_VERIFICATION,
        locations: dto.locations ? { create: dto.locations } : undefined,
        serviceRegions: dto.serviceRegions ? { create: dto.serviceRegions } : undefined,
        vehicleCapabilities: dto.vehicleCapabilities ? { create: dto.vehicleCapabilities } : undefined,
        cargoCapabilities: dto.cargoCapabilities ? { create: dto.cargoCapabilities } : undefined,
        availabilities: dto.availabilities ? { create: dto.availabilities.map(a => ({ ...a, availableFrom: a.availableFrom ? new Date(a.availableFrom) : undefined, availableUntil: a.availableUntil ? new Date(a.availableUntil) : undefined })) } : undefined,
      }
    });

    await this.auditService.createLog({ userId, action: 'VENDOR_CREATED', entity: 'Vendor', entityId: vendor.id, ipAddress: ip, userAgent });
    return vendor;
  }

  async findAll(query: VendorQueryDto) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '20', 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.preferredLanguage) where.preferredLanguage = query.preferredLanguage;
    if (query.callEnabled !== undefined) where.callEnabled = query.callEnabled;

    if (query.search) {
      where.OR = [
        { vendorCode: { contains: query.search, mode: 'insensitive' } },
        { companyName: { contains: query.search, mode: 'insensitive' } },
        { businessName: { contains: query.search, mode: 'insensitive' } },
        { contactPersonName: { contains: query.search, mode: 'insensitive' } },
        { primaryPhone: { contains: query.search } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.vehicleType) {
      where.vehicleCapabilities = { some: { vehicleType: query.vehicleType } };
    }
    if (query.cargoType) {
      where.cargoCapabilities = { some: { cargoType: query.cargoType } };
    }
    if (query.city) {
      where.OR = [
        ...(where.OR || []),
        { locations: { some: { city: { contains: query.city, mode: 'insensitive' } } } },
        { serviceRegions: { some: { city: { contains: query.city, mode: 'insensitive' } } } }
      ];
    }

    const [vendors, total] = await Promise.all([
      this.prisma.vendor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          locations: true,
          vehicleCapabilities: true,
          cargoCapabilities: true,
          availabilities: { orderBy: { updatedAt: 'desc' }, take: 1 }
        }
      }),
      this.prisma.vendor.count({ where })
    ]);

    return {
      vendors,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async findOne(id: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id },
      include: {
        locations: true,
        serviceRegions: true,
        vehicleCapabilities: true,
        cargoCapabilities: true,
        availabilities: { orderBy: { updatedAt: 'desc' } },
        performance: true,
        createdBy: { select: { id: true, firstName: true, lastName: true } }
      }
    });

    if (!vendor) throw new NotFoundException('Vendor not found');
    return vendor;
  }

  async update(id: string, dto: UpdateVendorDto, userId: string, ip: string, userAgent: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id } });
    if (!vendor) throw new NotFoundException('Vendor not found');

    if (dto.primaryPhone && dto.primaryPhone !== vendor.primaryPhone) {
      const existing = await this.prisma.vendor.findFirst({ where: { primaryPhone: dto.primaryPhone } });
      if (existing) throw new BadRequestException('A vendor with this primary phone number already exists.');
    }

    const updated = await this.prisma.vendor.update({
      where: { id },
      data: {
        companyName: dto.companyName,
        businessName: dto.businessName,
        contactPersonName: dto.contactPersonName,
        primaryPhone: dto.primaryPhone,
        alternatePhone: dto.alternatePhone,
        whatsappPhone: dto.whatsappPhone,
        email: dto.email,
        preferredLanguage: dto.preferredLanguage,
        callEnabled: dto.callEnabled,
        preferredCallStartTime: dto.preferredCallStartTime,
        preferredCallEndTime: dto.preferredCallEndTime,
        timezone: dto.timezone,
        notes: dto.notes,
        updatedById: userId,
      }
    });

    const changedFields = Object.keys(dto).filter(k => (dto as any)[k] !== undefined && (dto as any)[k] !== (vendor as any)[k]);
    await this.auditService.createLog({ userId, action: 'VENDOR_UPDATED', entity: 'Vendor', entityId: vendor.id, metadata: { changedFields }, ipAddress: ip, userAgent });

    return updated;
  }

  async changeStatus(id: string, dto: ChangeVendorStatusDto, userId: string, userRole: Role, ip: string, userAgent: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id } });
    if (!vendor) throw new NotFoundException('Vendor not found');

    if (dto.status === VendorStatus.SUSPENDED && userRole !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can suspend a vendor');
    }

    const updated = await this.prisma.vendor.update({
      where: { id },
      data: { status: dto.status, updatedById: userId }
    });

    await this.auditService.createLog({ userId, action: 'VENDOR_STATUS_CHANGED', entity: 'Vendor', entityId: vendor.id, metadata: { oldStatus: vendor.status, newStatus: dto.status }, ipAddress: ip, userAgent });

    return updated;
  }

  async remove(id: string, userId: string, userRole: Role, ip: string, userAgent: string) {
    if (userRole !== Role.ADMIN) throw new ForbiddenException('Only admins can deactivate a vendor');
    
    const vendor = await this.prisma.vendor.findUnique({ where: { id } });
    if (!vendor) throw new NotFoundException('Vendor not found');

    const updated = await this.prisma.vendor.update({
      where: { id },
      data: { status: VendorStatus.INACTIVE, updatedById: userId }
    });

    await this.auditService.createLog({ userId, action: 'VENDOR_DEACTIVATED', entity: 'Vendor', entityId: vendor.id, ipAddress: ip, userAgent });

    return updated;
  }
}
