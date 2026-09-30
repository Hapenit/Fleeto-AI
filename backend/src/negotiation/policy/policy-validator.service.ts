import { Injectable, BadRequestException } from '@nestjs/common';
import { NegotiationProposal } from '../providers/negotiation-ai-provider.interface.js';
import { NegotiationPolicy } from '@prisma/client';

@Injectable()
export class PolicyValidatorService {
  validateProposal(proposal: NegotiationProposal, policy: NegotiationPolicy, currentAttempts: number): void {
    if (proposal.action === 'MAKE_COUNTER_OFFER' && proposal.proposedAmount) {
      if (policy.maximumAuthorizedPrice && proposal.proposedAmount > policy.maximumAuthorizedPrice) {
        throw new BadRequestException(`Proposed amount ${proposal.proposedAmount} exceeds maximum authorized price ${policy.maximumAuthorizedPrice}.`);
      }
      
      if (!policy.allowPriceIncrease) {
        // Technically this needs previous offer to check if it increased. 
        // We will do a basic check in the engine.
      }
    }

    if (policy.maxAttempts && currentAttempts >= policy.maxAttempts) {
       if (proposal.action === 'MAKE_COUNTER_OFFER' || proposal.action === 'ASK_FOR_BETTER_PRICE') {
           throw new BadRequestException('Maximum negotiation attempts reached.');
       }
    }
  }
}
