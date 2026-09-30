import { PartialType } from '@nestjs/mapped-types';
import { CreateNegotiationPolicyDto } from './create-policy.dto.js';

export class UpdateNegotiationPolicyDto extends PartialType(CreateNegotiationPolicyDto) {}
