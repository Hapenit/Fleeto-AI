-- CreateEnum
CREATE TYPE "AIExtractionStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'NEEDS_CLARIFICATION', 'FAILED', 'APPLIED', 'REJECTED');

-- CreateTable
CREATE TABLE "AIRequirementExtraction" (
    "id" TEXT NOT NULL,
    "requirementId" TEXT,
    "inputText" TEXT NOT NULL,
    "extractedData" JSONB,
    "missingFields" JSONB,
    "ambiguities" JSONB,
    "confidence" DOUBLE PRECISION,
    "summary" TEXT,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "status" "AIExtractionStatus" NOT NULL DEFAULT 'PENDING',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIRequirementExtraction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AIRequirementExtraction" ADD CONSTRAINT "AIRequirementExtraction_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "Requirement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIRequirementExtraction" ADD CONSTRAINT "AIRequirementExtraction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
