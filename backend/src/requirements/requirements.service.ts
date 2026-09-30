import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RequirementNumberService } from './requirement-number.service.js';
import { RequirementStatusService } from './requirement-status.service.js';
import { RequirementValidationService } from './requirement-validation.service.js';
import { CreateRequirementDto, UpdateRequirementDto, RequirementQueryDto, CancelRequirementDto, ChangeRequirementStatusDto } from './dto/requirement.dto.js';
import { RequirementStatus, Prisma, Role } from '@prisma/client';

@Injectable()
export class RequirementsService {
  constructor(
    private prisma: PrismaService,
    private numberService: RequirementNumberService,
    private statusService: RequirementStatusService,
    private validationService: RequirementValidationService
  ) {}

  async create(createDto: CreateRequirementDto, userId: string) {
    const requirementNumber = await this.numberService.generateRequirementNumber();
    const req = await this.prisma.requirement.create({
      data: {
        ...createDto,
        requirementNumber,
        createdById: userId,
        status: RequirementStatus.DRAFT,
      },
    });

    await this.prisma.requirementStatusHistory.create({
      data: {
        requirementId: req.id,
        toStatus: RequirementStatus.DRAFT,
        changedById: userId,
        reason: 'Initial creation',
      },
    });

    return req;
  }

  async findAll(query: RequirementQueryDto, user: any) {
    const { page, limit, search, sortBy, sortOrder, status, vehicleType, cargoType, createdBy, dateFrom, dateTo, pickupLocation, deliveryLocation } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.RequirementWhereInput = {};

    if (user.role !== Role.ADMIN) {
      where.createdById = user.id;
    } else if (createdBy) {
      where.createdById = createdBy;
    }

    if (search) {
      where.OR = [
        { requirementNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerCompany: { contains: search, mode: 'insensitive' } },
        { pickupLocation: { contains: search, mode: 'insensitive' } },
        { deliveryLocation: { contains: search, mode: 'insensitive' } },
        { cargoType: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) where.status = status;
    if (vehicleType) where.vehicleType = { contains: vehicleType, mode: 'insensitive' };
    if (cargoType) where.cargoType = { contains: cargoType, mode: 'insensitive' };
    if (pickupLocation) where.pickupLocation = { contains: pickupLocation, mode: 'insensitive' };
    if (deliveryLocation) where.deliveryLocation = { contains: deliveryLocation, mode: 'insensitive' };
    if (dateFrom || dateTo) {
      where.pickupDate = {};
      if (dateFrom) where.pickupDate.gte = dateFrom;
      if (dateTo) where.pickupDate.lte = dateTo;
    }

    const [data, total] = await Promise.all([
      this.prisma.requirement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { createdBy: { select: { id: true, firstName: true, lastName: true } } },
      }),
      this.prisma.requirement.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, user: any) {
    const requirement = await this.prisma.requirement.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        statusHistory: {
          include: { changedBy: { select: { id: true, firstName: true, lastName: true } } },
          orderBy: { createdAt: 'asc' },
        },
        aiExtractions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!requirement) throw new NotFoundException('Requirement not found');

    if (user.role !== Role.ADMIN && requirement.createdById !== user.id) {
      throw new ForbiddenException('You do not have permission to view this requirement');
    }

    const validationResult = this.validationService.validateForReadyStatus(requirement);

    return { ...requirement, validationResult };
  }

  async update(id: string, updateDto: UpdateRequirementDto, user: any) {
    const req = await this.findOne(id, user);

    // Prevent uncontrolled modifications when calling
    const lockedStatuses: RequirementStatus[] = [
      RequirementStatus.CALLING,
      RequirementStatus.QUOTATION_RECEIVED,
      RequirementStatus.UNDER_REVIEW,
      RequirementStatus.VENDOR_SELECTED,
      RequirementStatus.COMPLETED,
      RequirementStatus.CANCELLED,
    ];

    if (lockedStatuses.includes(req.status)) {
      throw new BadRequestException(`Cannot edit requirement in ${req.status} status.`);
    }

    return this.prisma.requirement.update({
      where: { id },
      data: updateDto,
    });
  }

  async changeStatus(id: string, dto: ChangeRequirementStatusDto, user: any) {
    await this.findOne(id, user); // Authorization check
    return this.statusService.changeStatus(id, dto.status, user.id);
  }

  async cancel(id: string, dto: CancelRequirementDto, user: any) {
    await this.findOne(id, user);
    return this.statusService.changeStatus(id, RequirementStatus.CANCELLED, user.id, dto.reason);
  }

  async duplicate(id: string, user: any) {
    const req = await this.findOne(id, user);

    const requirementNumber = await this.numberService.generateRequirementNumber();
    
    // Omit fields that shouldn't be copied
    const { id: _, requirementNumber: __, status, createdAt, updatedAt, statusHistory, validationResult, createdBy, ...copyFields } = req as any;

    const newReq = await this.prisma.requirement.create({
      data: {
        ...copyFields,
        requirementNumber,
        createdById: user.id,
        status: RequirementStatus.DRAFT,
      },
    });

    await this.prisma.requirementStatusHistory.create({
      data: {
        requirementId: newReq.id,
        toStatus: RequirementStatus.DRAFT,
        changedById: user.id,
        reason: `Duplicated from ${req.requirementNumber}`,
      },
    });

    return newReq;
  }
}
