import { PartialType } from '@nestjs/mapped-types';
import { CreateQuotationDto } from './create-quotation.dto.js';

export class UpdateQuotationDto extends PartialType(CreateQuotationDto) {}
