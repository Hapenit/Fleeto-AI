import { z } from 'zod';
import { VendorStatus, VendorLanguage, VendorLocationType, ServiceRegionType, VendorAvailabilityStatus } from '@prisma/client';

export const CreateVendorLocationSchema = z.object({
  locationType: z.nativeEnum(VendorLocationType).optional(),
  address: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().optional(),
  pincode: z.string().optional(),
  isPrimary: z.boolean().optional(),
});

export const CreateVendorServiceRegionSchema = z.object({
  city: z.string().min(1, 'City is required'),
  state: z.string().optional(),
  pincode: z.string().optional(),
  regionType: z.nativeEnum(ServiceRegionType).optional(),
});

export const CreateVendorVehicleCapabilitySchema = z.object({
  vehicleType: z.string().min(1, 'Vehicle type is required'),
  vehicleBodyType: z.string().optional(),
  maximumCapacity: z.number().optional(),
  capacityUnit: z.string().optional(),
  vehicleCount: z.number().int().optional(),
  isPrimary: z.boolean().optional(),
});

export const CreateVendorCargoCapabilitySchema = z.object({
  cargoType: z.string().min(1, 'Cargo type is required'),
  maximumWeight: z.number().optional(),
  weightUnit: z.string().optional(),
  specialHandlingSupported: z.boolean().optional(),
  notes: z.string().optional(),
});

export const CreateVendorAvailabilitySchema = z.object({
  availabilityStatus: z.nativeEnum(VendorAvailabilityStatus).optional(),
  availableFrom: z.string().optional(),
  availableUntil: z.string().optional(),
  notes: z.string().optional(),
});

export const BaseCreateVendorSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  businessName: z.string().optional(),
  contactPersonName: z.string().min(1, 'Contact person name is required'),
  primaryPhone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format. Must start with + and country code (e.g., +919876543210)'),
  alternatePhone: z.string().optional(),
  whatsappPhone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  preferredLanguage: z.nativeEnum(VendorLanguage).optional(),
  callEnabled: z.boolean().optional(),
  preferredCallStartTime: z.string().optional(),
  preferredCallEndTime: z.string().optional(),
  timezone: z.string().optional(),
  notes: z.string().optional(),

  locations: z.array(CreateVendorLocationSchema).optional(),
  serviceRegions: z.array(CreateVendorServiceRegionSchema).optional(),
  vehicleCapabilities: z.array(CreateVendorVehicleCapabilitySchema).optional(),
  cargoCapabilities: z.array(CreateVendorCargoCapabilitySchema).optional(),
  availabilities: z.array(CreateVendorAvailabilitySchema).optional(),
});

export const CreateVendorSchema = BaseCreateVendorSchema.refine(data => {
  const hasLoc = data.locations && data.locations.length > 0;
  const hasReg = data.serviceRegions && data.serviceRegions.length > 0;
  const hasVeh = data.vehicleCapabilities && data.vehicleCapabilities.length > 0;
  const hasCar = data.cargoCapabilities && data.cargoCapabilities.length > 0;
  return hasLoc || hasReg || hasVeh || hasCar;
}, {
  message: 'At least one operational capability (location, service region, vehicle, or cargo capability) must be provided.',
});

export type CreateVendorDto = z.infer<typeof CreateVendorSchema>;

export const UpdateVendorSchema = BaseCreateVendorSchema.partial();
export type UpdateVendorDto = z.infer<typeof UpdateVendorSchema>;

export const ChangeVendorStatusSchema = z.object({
  status: z.nativeEnum(VendorStatus),
});
export type ChangeVendorStatusDto = z.infer<typeof ChangeVendorStatusSchema>;

export const VendorQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  status: z.nativeEnum(VendorStatus).optional(),
  preferredLanguage: z.nativeEnum(VendorLanguage).optional(),
  vehicleType: z.string().optional(),
  vehicleBodyType: z.string().optional(),
  cargoType: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  availabilityStatus: z.nativeEnum(VendorAvailabilityStatus).optional(),
  callEnabled: z.string().transform(val => val === 'true').optional(),
});
export type VendorQueryDto = z.infer<typeof VendorQuerySchema>;
