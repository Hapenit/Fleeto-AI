import { IsString, IsNotEmpty, IsInt, IsPositive, IsOptional } from 'class-validator';

export class ConfirmSelectionDto {
  @IsString()
  @IsNotEmpty()
  quotationId!: string;

  @IsInt()
  @IsPositive()
  version!: number;
  
  @IsString()
  @IsNotEmpty()
  reason!: string;
  
  @IsString()
  @IsOptional()
  notes?: string;
}
