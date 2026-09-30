import { z } from 'zod';
import { CargoWeightUnit, QuantityUnit, BudgetCurrency, AIExtractionStatus } from '@prisma/client';

export const AIRequirementExtractSchema = z.object({
  inputText: z.string().min(10, 'Please provide more details for accurate extraction.'),
  requirementId: z.string().optional(),
});
export type AIRequirementExtractDto = z.infer<typeof AIRequirementExtractSchema>;

export const AIRequirementApplySchema = z.object({
  acceptedFields: z.object({
    customerName: z.string().optional(),
    customerCompany: z.string().optional(),
    customerPhone: z.string().optional(),
    customerEmail: z.string().email().optional().or(z.literal('')),
    pickupLocation: z.string().optional(),
    pickupAddress: z.string().optional(),
    pickupCity: z.string().optional(),
    pickupState: z.string().optional(),
    pickupPincode: z.string().optional(),
    deliveryLocation: z.string().optional(),
    deliveryAddress: z.string().optional(),
    deliveryCity: z.string().optional(),
    deliveryState: z.string().optional(),
    deliveryPincode: z.string().optional(),
    pickupDate: z.string().optional(),
    pickupTime: z.string().optional(),
    deliveryDeadline: z.string().optional(),
    cargoType: z.string().optional(),
    cargoDescription: z.string().optional(),
    cargoWeight: z.number().optional(),
    cargoWeightUnit: z.nativeEnum(CargoWeightUnit).optional(),
    cargoQuantity: z.number().int().optional(),
    cargoQuantityUnit: z.nativeEnum(QuantityUnit).optional(),
    vehicleType: z.string().optional(),
    vehicleBodyType: z.string().optional(),
    specialHandlingRequired: z.boolean().optional(),
    specialHandlingDetails: z.string().optional(),
    loadingRequired: z.boolean().optional(),
    loadingDetails: z.string().optional(),
    unloadingRequired: z.boolean().optional(),
    unloadingDetails: z.string().optional(),
    budget: z.number().optional(),
    budgetCurrency: z.nativeEnum(BudgetCurrency).optional(),
    preferredVendorConditions: z.string().optional(),
    additionalNotes: z.string().optional(),
  }),
});
export type AIRequirementApplyDto = z.infer<typeof AIRequirementApplySchema>;

export const AIRequirementRejectSchema = z.object({
  reason: z.string().optional(),
});
export type AIRequirementRejectDto = z.infer<typeof AIRequirementRejectSchema>;

export interface AIExtractionResult {
  extractedData: Record<string, any>;
  missingFields: string[];
  ambiguities: string[];
  confidence: number;
  summary: string;
}
