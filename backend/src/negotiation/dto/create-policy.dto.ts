import { IsNumber, IsBoolean, IsEnum, IsOptional } from 'class-validator';

export enum NegotiationMode {
  MANUAL = 'MANUAL',
  AI_ASSISTED = 'AI_ASSISTED',
  AI_AUTONOMOUS = 'AI_AUTONOMOUS'
}

export class CreateNegotiationPolicyDto {
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @IsEnum(NegotiationMode)
  @IsOptional()
  mode?: NegotiationMode;

  @IsNumber()
  @IsOptional()
  targetPrice?: number;

  @IsNumber()
  @IsOptional()
  maximumAuthorizedPrice?: number;

  @IsNumber()
  @IsOptional()
  minimumVendorPrice?: number;

  @IsNumber()
  @IsOptional()
  maxAttempts?: number;

  @IsNumber()
  @IsOptional()
  maxCounterOffers?: number;

  @IsBoolean()
  @IsOptional()
  allowPriceIncrease?: boolean;

  @IsBoolean()
  @IsOptional()
  allowVendorCounterOffer?: boolean;

  @IsNumber()
  @IsOptional()
  requireHumanApprovalAbove?: number;

  @IsBoolean()
  @IsOptional()
  autoStopOnConditionChange?: boolean;
}
