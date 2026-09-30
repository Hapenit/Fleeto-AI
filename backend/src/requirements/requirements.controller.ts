import { Controller, Get, Post, Body, Patch, Param, UseGuards, Query, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { RequirementsService } from './requirements.service.js';
import { CreateRequirementSchema, UpdateRequirementSchema, RequirementQuerySchema, CancelRequirementSchema, ChangeRequirementStatusSchema } from './dto/requirement.dto.js';
import type { CreateRequirementDto, UpdateRequirementDto, RequirementQueryDto, CancelRequirementDto, ChangeRequirementStatusDto } from './dto/requirement.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { AuditService } from '../audit/audit.service.js';

@Controller('api/requirements')
@UseGuards(JwtAuthGuard)
export class RequirementsController {
  constructor(
    private readonly requirementsService: RequirementsService,
    private readonly auditService: AuditService,
  ) {}

  @Post()
  async create(@Body(new ZodValidationPipe(CreateRequirementSchema)) createRequirementDto: CreateRequirementDto, @Req() req: any) {
    const requirement = await this.requirementsService.create(createRequirementDto, req.user.id);
    await this.auditService.createLog({ userId: req.user.id, action: 'REQUIREMENT_CREATED', entity: 'Requirement', entityId: requirement.id, metadata: { requirementNumber: requirement.requirementNumber }, ipAddress: req.ip, userAgent: req.headers['user-agent'] });
    return { success: true, data: requirement };
  }

  @Get()
  async findAll(@Query(new ZodValidationPipe(RequirementQuerySchema)) query: RequirementQueryDto, @Req() req: any) {
    const result = await this.requirementsService.findAll(query, req.user);
    return { success: true, ...result };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const data = await this.requirementsService.findOne(id, req.user);
    return { success: true, data };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body(new ZodValidationPipe(UpdateRequirementSchema)) updateRequirementDto: UpdateRequirementDto, @Req() req: any) {
    const requirement = await this.requirementsService.update(id, updateRequirementDto, req.user);
    await this.auditService.createLog({ userId: req.user.id, action: 'REQUIREMENT_UPDATED', entity: 'Requirement', entityId: requirement.id, metadata: { updatedFields: Object.keys(updateRequirementDto) }, ipAddress: req.ip, userAgent: req.headers['user-agent'] });
    return { success: true, data: requirement };
  }

  @Post(':id/status')
  @HttpCode(HttpStatus.OK)
  async changeStatus(@Param('id') id: string, @Body(new ZodValidationPipe(ChangeRequirementStatusSchema)) dto: ChangeRequirementStatusDto, @Req() req: any) {
    const requirement = await this.requirementsService.changeStatus(id, dto, req.user);
    await this.auditService.createLog({ userId: req.user.id, action: 'REQUIREMENT_STATUS_CHANGED', entity: 'Requirement', entityId: requirement.id, metadata: { newStatus: dto.status }, ipAddress: req.ip, userAgent: req.headers['user-agent'] });
    return { success: true, data: requirement };
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(@Param('id') id: string, @Body(new ZodValidationPipe(CancelRequirementSchema)) dto: CancelRequirementDto, @Req() req: any) {
    const requirement = await this.requirementsService.cancel(id, dto, req.user);
    await this.auditService.createLog({ userId: req.user.id, action: 'REQUIREMENT_CANCELLED', entity: 'Requirement', entityId: requirement.id, metadata: { reason: dto.reason }, ipAddress: req.ip, userAgent: req.headers['user-agent'] });
    return { success: true, data: requirement };
  }

  @Post(':id/duplicate')
  @HttpCode(HttpStatus.CREATED)
  async duplicate(@Param('id') id: string, @Req() req: any) {
    const requirement = await this.requirementsService.duplicate(id, req.user);
    await this.auditService.createLog({ userId: req.user.id, action: 'REQUIREMENT_DUPLICATED', entity: 'Requirement', entityId: requirement.id, metadata: { originalId: id }, ipAddress: req.ip, userAgent: req.headers['user-agent'] });
    return { success: true, data: requirement };
  }
}
