import { IsString, IsNotEmpty, IsEnum, IsOptional, IsDateString, IsNumber } from 'class-validator';
import { FollowUpType, FollowUpReason } from '@prisma/client';

export class CreateFollowUpDto {
  @IsString()
  @IsNotEmpty()
  requirementId: string;

  @IsString()
  @IsNotEmpty()
  vendorId: string;

  @IsEnum(FollowUpType)
  type: FollowUpType;

  @IsEnum(FollowUpReason)
  reason: FollowUpReason;

  @IsDateString()
  @IsOptional()
  scheduledAt?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  sourceCallId?: string;

  @IsString()
  @IsOptional()
  assignedToUserId?: string;

  @IsString()
  @IsOptional()
  requestedTimeText?: string;
}

export class ScheduleFollowUpDto {
  @IsDateString()
  @IsNotEmpty()
  scheduledAt: string;
}

export class RescheduleFollowUpDto {
  @IsDateString()
  @IsNotEmpty()
  scheduledAt: string;

  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class CancelFollowUpDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class AssignFollowUpDto {
  @IsString()
  @IsOptional()
  assignedToUserId?: string;
}

export class CompleteFollowUpDto {
  @IsString()
  @IsNotEmpty()
  notes: string;
}
