import { z } from 'zod';
import { RequirementStatus, CargoWeightUnit, QuantityUnit, BudgetCurrency, RequirementSource } from '@prisma/client';

export const CreateRequirementSchema = z.object({
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
  pickupDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  pickupTime: z.string().optional(),
  deliveryDeadline: z.string().optional().transform(val => val ? new Date(val) : undefined),
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
});

export type CreateRequirementDto = z.infer<typeof CreateRequirementSchema>;

export const UpdateRequirementSchema = CreateRequirementSchema.partial();
export type UpdateRequirementDto = z.infer<typeof UpdateRequirementSchema>;

export const ChangeRequirementStatusSchema = z.object({
  status: z.nativeEnum(RequirementStatus),
});
export type ChangeRequirementStatusDto = z.infer<typeof ChangeRequirementStatusSchema>;

export const CancelRequirementSchema = z.object({
  reason: z.string().min(1, 'Reason is required for cancellation'),
});
export type CancelRequirementDto = z.infer<typeof CancelRequirementSchema>;

export const RequirementQuerySchema = z.object({
  page: z.string().optional().transform(val => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform(val => (val ? parseInt(val, 10) : 20)),
  search: z.string().optional(),
  status: z.nativeEnum(RequirementStatus).optional(),
  vehicleType: z.string().optional(),
  cargoType: z.string().optional(),
  dateFrom: z.string().optional().transform(val => val ? new Date(val) : undefined),
  dateTo: z.string().optional().transform(val => val ? new Date(val) : undefined),
  createdBy: z.string().optional(),
  pickupLocation: z.string().optional(),
  deliveryLocation: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'pickupDate', 'requirementNumber', 'status', 'customerName']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});
export type RequirementQueryDto = z.infer<typeof RequirementQuerySchema>;
