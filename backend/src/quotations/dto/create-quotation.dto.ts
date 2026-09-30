import { IsString, IsNumber, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { QuotationSource } from '@prisma/client';

export class CreateQuotationDto {
  @IsString()
  requirementId!: string;

  @IsString()
  vendorId!: string;

  @IsString()
  @IsOptional()
  callId?: string;

  @IsString()
  @IsOptional()
  negotiationId?: string;

  @IsNumber()
  @IsOptional()
  initialAmount?: number;

  @IsNumber()
  @IsOptional()
  finalAmount?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsEnum(QuotationSource)
  @IsOptional()
  source?: QuotationSource;

  @IsBoolean()
  @IsOptional()
  vendorConfirmed?: boolean;
}
