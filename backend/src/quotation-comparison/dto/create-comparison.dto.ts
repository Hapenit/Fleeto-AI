import { IsString } from 'class-validator';

export class CreateComparisonDto {
  @IsString()
  requirementId!: string;
}
