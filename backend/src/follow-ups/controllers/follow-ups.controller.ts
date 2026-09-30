import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { FollowUpsService } from '../services/follow-ups.service.js';
import type { CreateFollowUpDto, ScheduleFollowUpDto, RescheduleFollowUpDto, CancelFollowUpDto, CompleteFollowUpDto, AssignFollowUpDto } from '../dto/follow-up.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@Controller('api/follow-ups')
@UseGuards(JwtAuthGuard)
export class FollowUpsController {
  constructor(private readonly followUpsService: FollowUpsService) {}

  @Post()
  create(@Body() createFollowUpDto: CreateFollowUpDto, @Request() req: any) {
    return this.followUpsService.create(createFollowUpDto, req.user.userId);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.followUpsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.followUpsService.findOne(id);
  }

  @Post(':id/schedule')
  schedule(@Param('id') id: string, @Body() dto: ScheduleFollowUpDto, @Request() req: any) {
    return this.followUpsService.schedule(id, dto, req.user.userId);
  }

  @Post(':id/reschedule')
  reschedule(@Param('id') id: string, @Body() dto: RescheduleFollowUpDto, @Request() req: any) {
    return this.followUpsService.reschedule(id, dto, req.user.userId);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string, @Body() dto: CancelFollowUpDto, @Request() req: any) {
    return this.followUpsService.cancel(id, dto, req.user.userId);
  }

  @Post(':id/retry')
  retryNow(@Param('id') id: string, @Request() req: any) {
    return this.followUpsService.retryNow(id, req.user.userId);
  }

  @Post(':id/complete')
  complete(@Param('id') id: string, @Body() dto: CompleteFollowUpDto, @Request() req: any) {
    return this.followUpsService.complete(id, dto, req.user.userId);
  }

  @Post(':id/assign')
  assign(@Param('id') id: string, @Body() dto: AssignFollowUpDto, @Request() req: any) {
    return this.followUpsService.assign(id, dto, req.user.userId);
  }
}
