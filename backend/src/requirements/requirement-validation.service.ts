import { Injectable } from '@nestjs/common';
import { Requirement } from '@prisma/client';

export interface ValidationResult {
  valid: boolean;
  missingFields: string[];
  warnings: string[];
  errors: string[];
}

@Injectable()
export class RequirementValidationService {
  validateForReadyStatus(req: Partial<Requirement>): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      missingFields: [],
      warnings: [],
      errors: [],
    };

    // Mandatory for READY status:
    // Customer Name, Pickup Location, Delivery Location, Cargo Type, Cargo Weight, Vehicle Type, Pickup Date
    const requiredFields = [
      'customerName',
      'pickupLocation',
      'deliveryLocation',
      'cargoType',
      'cargoWeight',
      'vehicleType',
      'pickupDate'
    ];

    for (const field of requiredFields) {
      if (req[field as keyof Requirement] === null || req[field as keyof Requirement] === undefined || req[field as keyof Requirement] === '') {
        result.missingFields.push(field);
      }
    }

    if (req.cargoWeight !== null && req.cargoWeight !== undefined && req.cargoWeight <= 0) {
      result.errors.push('cargoWeight must be > 0');
    }

    if (req.budget !== null && req.budget !== undefined && req.budget < 0) {
      result.errors.push('budget cannot be negative');
    }

    if (req.pickupDate && req.deliveryDeadline) {
      if (new Date(req.deliveryDeadline) < new Date(req.pickupDate)) {
        result.errors.push('deliveryDeadline cannot be before pickupDate');
      }
    }

    if (result.missingFields.length > 0 || result.errors.length > 0) {
      result.valid = false;
    }

    return result;
  }
}
