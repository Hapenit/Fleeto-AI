-- CreateEnum
CREATE TYPE "RequirementStatus" AS ENUM ('DRAFT', 'READY', 'VALIDATION_REQUIRED', 'MATCHING', 'CALLING', 'QUOTATION_RECEIVED', 'UNDER_REVIEW', 'VENDOR_SELECTED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CargoWeightUnit" AS ENUM ('KG', 'TON', 'GRAM');

-- CreateEnum
CREATE TYPE "QuantityUnit" AS ENUM ('UNIT', 'PALLET', 'BOX', 'CONTAINER', 'LOAD', 'OTHER');

-- CreateEnum
CREATE TYPE "BudgetCurrency" AS ENUM ('INR');

-- CreateEnum
CREATE TYPE "RequirementSource" AS ENUM ('MANUAL', 'AI_ASSISTED', 'IMPORTED');

-- CreateTable
CREATE TABLE "Requirement" (
    "id" TEXT NOT NULL,
    "requirementNumber" TEXT NOT NULL,
    "customerName" TEXT,
    "customerCompany" TEXT,
    "customerPhone" TEXT,
    "customerEmail" TEXT,
    "pickupLocation" TEXT,
    "pickupAddress" TEXT,
    "pickupCity" TEXT,
    "pickupState" TEXT,
    "pickupPincode" TEXT,
    "deliveryLocation" TEXT,
    "deliveryAddress" TEXT,
    "deliveryCity" TEXT,
    "deliveryState" TEXT,
    "deliveryPincode" TEXT,
    "pickupDate" TIMESTAMP(3),
    "pickupTime" TEXT,
    "deliveryDeadline" TIMESTAMP(3),
    "cargoType" TEXT,
    "cargoDescription" TEXT,
    "cargoWeight" DOUBLE PRECISION,
    "cargoWeightUnit" "CargoWeightUnit",
    "cargoQuantity" INTEGER,
    "cargoQuantityUnit" "QuantityUnit",
    "vehicleType" TEXT,
    "vehicleBodyType" TEXT,
    "specialHandlingRequired" BOOLEAN NOT NULL DEFAULT false,
    "specialHandlingDetails" TEXT,
    "loadingRequired" BOOLEAN NOT NULL DEFAULT false,
    "loadingDetails" TEXT,
    "unloadingRequired" BOOLEAN NOT NULL DEFAULT false,
    "unloadingDetails" TEXT,
    "budget" DOUBLE PRECISION,
    "budgetCurrency" "BudgetCurrency",
    "preferredVendorConditions" TEXT,
    "additionalNotes" TEXT,
    "source" "RequirementSource" NOT NULL DEFAULT 'MANUAL',
    "status" "RequirementStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Requirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequirementStatusHistory" (
    "id" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "fromStatus" "RequirementStatus",
    "toStatus" "RequirementStatus" NOT NULL,
    "changedById" TEXT NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequirementStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Requirement_requirementNumber_key" ON "Requirement"("requirementNumber");

-- AddForeignKey
ALTER TABLE "Requirement" ADD CONSTRAINT "Requirement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementStatusHistory" ADD CONSTRAINT "RequirementStatusHistory_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "Requirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementStatusHistory" ADD CONSTRAINT "RequirementStatusHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
