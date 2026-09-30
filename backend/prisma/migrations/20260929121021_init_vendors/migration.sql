-- CreateEnum
CREATE TYPE "VendorStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION');

-- CreateEnum
CREATE TYPE "VendorLanguage" AS ENUM ('TA', 'TA_EN', 'EN', 'HI', 'OTHER');

-- CreateEnum
CREATE TYPE "VendorLocationType" AS ENUM ('OFFICE', 'YARD', 'DEPOT', 'GARAGE', 'OTHER');

-- CreateEnum
CREATE TYPE "ServiceRegionType" AS ENUM ('PICKUP', 'DELIVERY', 'BOTH');

-- CreateEnum
CREATE TYPE "VendorAvailabilityStatus" AS ENUM ('AVAILABLE', 'BUSY', 'UNKNOWN');

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "vendorCode" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "businessName" TEXT,
    "contactPersonName" TEXT NOT NULL,
    "primaryPhone" TEXT NOT NULL,
    "alternatePhone" TEXT,
    "whatsappPhone" TEXT,
    "email" TEXT,
    "preferredLanguage" "VendorLanguage" NOT NULL DEFAULT 'EN',
    "status" "VendorStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "callEnabled" BOOLEAN NOT NULL DEFAULT false,
    "preferredCallStartTime" TEXT,
    "preferredCallEndTime" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorLocation" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "locationType" "VendorLocationType" NOT NULL DEFAULT 'OFFICE',
    "address" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "pincode" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorServiceRegion" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "pincode" TEXT,
    "regionType" "ServiceRegionType" NOT NULL DEFAULT 'BOTH',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorServiceRegion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorVehicleCapability" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "vehicleType" TEXT NOT NULL,
    "vehicleBodyType" TEXT,
    "minimumCapacity" DOUBLE PRECISION,
    "maximumCapacity" DOUBLE PRECISION,
    "capacityUnit" TEXT,
    "vehicleCount" INTEGER NOT NULL DEFAULT 1,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorVehicleCapability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorCargoCapability" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "cargoType" TEXT NOT NULL,
    "maximumWeight" DOUBLE PRECISION,
    "weightUnit" TEXT,
    "specialHandlingSupported" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorCargoCapability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorAvailability" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "availabilityStatus" "VendorAvailabilityStatus" NOT NULL DEFAULT 'UNKNOWN',
    "availableFrom" TIMESTAMP(3),
    "availableUntil" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorPerformance" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "totalTrips" INTEGER NOT NULL DEFAULT 0,
    "successfulTrips" INTEGER NOT NULL DEFAULT 0,
    "cancelledTrips" INTEGER NOT NULL DEFAULT 0,
    "noShowTrips" INTEGER NOT NULL DEFAULT 0,
    "averageResponseTimeMinutes" DOUBLE PRECISION,
    "averageQuotedPrice" DOUBLE PRECISION,
    "averageFinalPrice" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "lastTripDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorPerformance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_vendorCode_key" ON "Vendor"("vendorCode");

-- CreateIndex
CREATE INDEX "Vendor_vendorCode_idx" ON "Vendor"("vendorCode");

-- CreateIndex
CREATE INDEX "Vendor_companyName_idx" ON "Vendor"("companyName");

-- CreateIndex
CREATE INDEX "Vendor_status_idx" ON "Vendor"("status");

-- CreateIndex
CREATE INDEX "Vendor_preferredLanguage_idx" ON "Vendor"("preferredLanguage");

-- CreateIndex
CREATE INDEX "Vendor_primaryPhone_idx" ON "Vendor"("primaryPhone");

-- CreateIndex
CREATE INDEX "VendorLocation_city_idx" ON "VendorLocation"("city");

-- CreateIndex
CREATE INDEX "VendorLocation_state_idx" ON "VendorLocation"("state");

-- CreateIndex
CREATE INDEX "VendorServiceRegion_city_idx" ON "VendorServiceRegion"("city");

-- CreateIndex
CREATE INDEX "VendorServiceRegion_state_idx" ON "VendorServiceRegion"("state");

-- CreateIndex
CREATE INDEX "VendorVehicleCapability_vehicleType_idx" ON "VendorVehicleCapability"("vehicleType");

-- CreateIndex
CREATE INDEX "VendorVehicleCapability_maximumCapacity_idx" ON "VendorVehicleCapability"("maximumCapacity");

-- CreateIndex
CREATE INDEX "VendorCargoCapability_cargoType_idx" ON "VendorCargoCapability"("cargoType");

-- CreateIndex
CREATE UNIQUE INDEX "VendorPerformance_vendorId_key" ON "VendorPerformance"("vendorId");

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorLocation" ADD CONSTRAINT "VendorLocation_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorServiceRegion" ADD CONSTRAINT "VendorServiceRegion_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorVehicleCapability" ADD CONSTRAINT "VendorVehicleCapability_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorCargoCapability" ADD CONSTRAINT "VendorCargoCapability_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorAvailability" ADD CONSTRAINT "VendorAvailability_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorPerformance" ADD CONSTRAINT "VendorPerformance_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
