import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateFollowUpDto, ScheduleFollowUpDto, RescheduleFollowUpDto, CancelFollowUpDto, CompleteFollowUpDto, AssignFollowUpDto } from '../dto/follow-up.dto.js';
import { FollowUpStatus, FollowUpAuditAction, Prisma } from '@prisma/client';

@Injectable()
export class FollowUpsService {
  constructor(private prisma: PrismaService) {}

  private async generateFollowUpNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.followUp.count({
      where: { followUpNumber: { startsWith: `FUP-${year}-` } }
    });
    return `FUP-${year}-${String(count + 1).padStart(6, '0')}`;
  }

  async create(createFollowUpDto: CreateFollowUpDto, userId: string) {
    // Duplicate prevention
    const existingActive = await this.prisma.followUp.findFirst({
      where: {
        requirementId: createFollowUpDto.requirementId,
        vendorId: createFollowUpDto.vendorId,
        status: { in: ['PENDING', 'SCHEDULED', 'READY', 'CALLING'] },
        type: createFollowUpDto.type,
      }
    });

    if (existingActive) {
      throw new BadRequestException('An active follow-up of this type already exists for this requirement and vendor.');
    }

    const followUpNumber = await this.generateFollowUpNumber();

    const status = createFollowUpDto.scheduledAt ? FollowUpStatus.SCHEDULED : FollowUpStatus.PENDING;

    const followUp = await this.prisma.followUp.create({
      data: {
        followUpNumber,
        requirementId: createFollowUpDto.requirementId,
        vendorId: createFollowUpDto.vendorId,
        type: createFollowUpDto.type,
        reason: createFollowUpDto.reason,
        status,
        scheduledAt: createFollowUpDto.scheduledAt ? new Date(createFollowUpDto.scheduledAt) : null,
        notes: createFollowUpDto.notes,
        sourceCallId: createFollowUpDto.sourceCallId,
        assignedToUserId: createFollowUpDto.assignedToUserId,
        requestedTimeText: createFollowUpDto.requestedTimeText,
        createdById: userId,
      }
    });

    await this.prisma.followUpAudit.create({
      data: {
        followUpId: followUp.id,
        action: FollowUpAuditAction.FOLLOW_UP_CREATED,
        userId,
        newStatus: status,
      }
    });

    return followUp;
  }

  async findAll(query: any) {
    const { page = 1, limit = 25, status, requirementId, vendorId, type } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.FollowUpWhereInput = {};
    if (status) where.status = status as FollowUpStatus;
    if (requirementId) where.requirementId = requirementId;
    if (vendorId) where.vendorId = vendorId;
    if (type) where.type = type;

    const [items, total] = await Promise.all([
      this.prisma.followUp.findMany({
        where,
        skip: Number(skip),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          vendor: { select: { id: true, companyName: true, primaryPhone: true } },
          requirement: { select: { id: true, requirementNumber: true } },
          assignedToUser: { select: { id: true, email: true, firstName: true, lastName: true } },
        }
      }),
      this.prisma.followUp.count({ where })
    ]);

    return {
      items,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    };
  }

  async findOne(id: string) {
    const followUp = await this.prisma.followUp.findUnique({
      where: { id },
      include: {
        vendor: true,
        requirement: true,
        sourceCall: true,
        attempts: {
          orderBy: { attemptNumber: 'asc' }
        },
        auditEntries: {
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { firstName: true, lastName: true } } }
        },
        assignedToUser: { select: { firstName: true, lastName: true } },
      }
    });

    if (!followUp) throw new NotFoundException('Follow-up not found');
    return followUp;
  }

  async schedule(id: string, dto: ScheduleFollowUpDto, userId: string) {
    const followUp = await this.prisma.followUp.findUnique({ where: { id } });
    if (!followUp) throw new NotFoundException('Follow-up not found');

    if (followUp.status !== 'PENDING' && followUp.status !== 'FOLLOW_UP_REQUIRED') {
      throw new BadRequestException(`Cannot schedule follow-up in ${followUp.status} status`);
    }

    const updated = await this.prisma.followUp.update({
      where: { id },
      data: {
        status: FollowUpStatus.SCHEDULED,
        scheduledAt: new Date(dto.scheduledAt),
      }
    });

    await this.prisma.followUpAudit.create({
      data: {
        followUpId: id,
        action: FollowUpAuditAction.FOLLOW_UP_SCHEDULED,
        userId,
        previousStatus: followUp.status,
        newStatus: FollowUpStatus.SCHEDULED,
        metadata: { scheduledAt: dto.scheduledAt }
      }
    });

    return updated;
  }

  async reschedule(id: string, dto: RescheduleFollowUpDto, userId: string) {
    const followUp = await this.prisma.followUp.findUnique({ where: { id } });
    if (!followUp) throw new NotFoundException('Follow-up not found');

    if (!['SCHEDULED', 'READY', 'FAILED', 'FOLLOW_UP_REQUIRED'].includes(followUp.status)) {
      throw new BadRequestException(`Cannot reschedule follow-up in ${followUp.status} status`);
    }

    const updated = await this.prisma.followUp.update({
      where: { id },
      data: {
        status: FollowUpStatus.SCHEDULED,
        scheduledAt: new Date(dto.scheduledAt),
      }
    });

    await this.prisma.followUpAudit.create({
      data: {
        followUpId: id,
        action: FollowUpAuditAction.FOLLOW_UP_RESCHEDULED,
        userId,
        previousStatus: followUp.status,
        newStatus: FollowUpStatus.SCHEDULED,
        metadata: { scheduledAt: dto.scheduledAt, reason: dto.reason, previousScheduledAt: followUp.scheduledAt }
      }
    });

    return updated;
  }

  async cancel(id: string, dto: CancelFollowUpDto, userId: string) {
    const followUp = await this.prisma.followUp.findUnique({ where: { id } });
    if (!followUp) throw new NotFoundException('Follow-up not found');

    if (['COMPLETED', 'CANCELLED'].includes(followUp.status)) {
      throw new BadRequestException('Follow-up is already completed or cancelled');
    }

    const updated = await this.prisma.followUp.update({
      where: { id },
      data: {
        status: FollowUpStatus.CANCELLED,
        cancelledAt: new Date(),
      }
    });

    await this.prisma.followUpAudit.create({
      data: {
        followUpId: id,
        action: FollowUpAuditAction.FOLLOW_UP_CANCELLED,
        userId,
        previousStatus: followUp.status,
        newStatus: FollowUpStatus.CANCELLED,
        metadata: { reason: dto.reason }
      }
    });

    return updated;
  }

  async complete(id: string, dto: CompleteFollowUpDto, userId: string) {
    const followUp = await this.prisma.followUp.findUnique({ where: { id } });
    if (!followUp) throw new NotFoundException('Follow-up not found');

    const updated = await this.prisma.followUp.update({
      where: { id },
      data: {
        status: FollowUpStatus.COMPLETED,
        completedAt: new Date(),
        notes: dto.notes,
      }
    });

    await this.prisma.followUpAudit.create({
      data: {
        followUpId: id,
        action: FollowUpAuditAction.FOLLOW_UP_MARKED_COMPLETE,
        userId,
        previousStatus: followUp.status,
        newStatus: FollowUpStatus.COMPLETED,
        metadata: { notes: dto.notes }
      }
    });

    return updated;
  }

  async retryNow(id: string, userId: string) {
    const followUp = await this.prisma.followUp.findUnique({ where: { id } });
    if (!followUp) throw new NotFoundException('Follow-up not found');
    
    // Simulate immediately setting it to READY so the scheduler picks it up
    const updated = await this.prisma.followUp.update({
      where: { id },
      data: {
        status: FollowUpStatus.READY,
        scheduledAt: new Date(),
      }
    });

    await this.prisma.followUpAudit.create({
      data: {
        followUpId: id,
        action: FollowUpAuditAction.FOLLOW_UP_RESCHEDULED,
        userId,
        previousStatus: followUp.status,
        newStatus: FollowUpStatus.READY,
        metadata: { reason: 'Manual Retry Now requested' }
      }
    });

    return updated;
  }

  async assign(id: string, dto: AssignFollowUpDto, userId: string) {
    const followUp = await this.prisma.followUp.findUnique({ where: { id } });
    if (!followUp) throw new NotFoundException('Follow-up not found');

    const updated = await this.prisma.followUp.update({
      where: { id },
      data: {
        assignedToUserId: dto.assignedToUserId,
      }
    });

    await this.prisma.followUpAudit.create({
      data: {
        followUpId: id,
        action: FollowUpAuditAction.FOLLOW_UP_ASSIGNED,
        userId,
        metadata: { assignedToUserId: dto.assignedToUserId }
      }
    });

    return updated;
  }
}
