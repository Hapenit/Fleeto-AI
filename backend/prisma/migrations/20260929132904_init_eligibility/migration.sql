-- CreateEnum
CREATE TYPE "EligibilityRuleType" AS ENUM ('MANDATORY', 'CONDITIONAL', 'INFORMATIONAL');

-- CreateEnum
CREATE TYPE "RuleStatus" AS ENUM ('PASS', 'FAIL', 'REVIEW', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "RuleSeverity" AS ENUM ('ERROR', 'WARNING', 'INFO');

-- CreateEnum
CREATE TYPE "EvaluationStatus" AS ENUM ('COMPLETED', 'NEEDS_REVIEW', 'FAILED');

-- CreateEnum
CREATE TYPE "EvaluationRunStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "VendorEligibilityRun" (
    "id" TEXT NOT NULL,
    "runNumber" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "engineVersion" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "totalVendors" INTEGER NOT NULL DEFAULT 0,
    "eligibleCount" INTEGER NOT NULL DEFAULT 0,
    "ineligibleCount" INTEGER NOT NULL DEFAULT 0,
    "needsReviewCount" INTEGER NOT NULL DEFAULT 0,
    "status" "EvaluationRunStatus" NOT NULL DEFAULT 'QUEUED',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorEligibilityRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorEligibilityEvaluation" (
    "id" TEXT NOT NULL,
    "evaluationNumber" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "status" "EvaluationStatus" NOT NULL,
    "eligible" BOOLEAN NOT NULL DEFAULT false,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "engineVersion" TEXT NOT NULL,
    "passedRules" INTEGER NOT NULL DEFAULT 0,
    "failedRules" INTEGER NOT NULL DEFAULT 0,
    "reviewRules" INTEGER NOT NULL DEFAULT 0,
    "notApplicableRules" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorEligibilityEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorEligibilityRuleResult" (
    "id" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "ruleCode" TEXT NOT NULL,
    "ruleName" TEXT NOT NULL,
    "status" "RuleStatus" NOT NULL,
    "severity" "RuleSeverity" NOT NULL,
    "message" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorEligibilityRuleResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VendorEligibilityRun_runNumber_key" ON "VendorEligibilityRun"("runNumber");

-- CreateIndex
CREATE INDEX "VendorEligibilityRun_requirementId_idx" ON "VendorEligibilityRun"("requirementId");

-- CreateIndex
CREATE UNIQUE INDEX "VendorEligibilityEvaluation_evaluationNumber_key" ON "VendorEligibilityEvaluation"("evaluationNumber");

-- CreateIndex
CREATE INDEX "VendorEligibilityEvaluation_runId_idx" ON "VendorEligibilityEvaluation"("runId");

-- CreateIndex
CREATE INDEX "VendorEligibilityEvaluation_requirementId_idx" ON "VendorEligibilityEvaluation"("requirementId");

-- CreateIndex
CREATE INDEX "VendorEligibilityEvaluation_vendorId_idx" ON "VendorEligibilityEvaluation"("vendorId");

-- CreateIndex
CREATE INDEX "VendorEligibilityEvaluation_status_idx" ON "VendorEligibilityEvaluation"("status");

-- CreateIndex
CREATE INDEX "VendorEligibilityRuleResult_evaluationId_idx" ON "VendorEligibilityRuleResult"("evaluationId");

-- CreateIndex
CREATE INDEX "VendorEligibilityRuleResult_ruleCode_idx" ON "VendorEligibilityRuleResult"("ruleCode");

-- AddForeignKey
ALTER TABLE "VendorEligibilityRun" ADD CONSTRAINT "VendorEligibilityRun_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "Requirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorEligibilityRun" ADD CONSTRAINT "VendorEligibilityRun_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorEligibilityEvaluation" ADD CONSTRAINT "VendorEligibilityEvaluation_runId_fkey" FOREIGN KEY ("runId") REFERENCES "VendorEligibilityRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorEligibilityEvaluation" ADD CONSTRAINT "VendorEligibilityEvaluation_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "Requirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorEligibilityEvaluation" ADD CONSTRAINT "VendorEligibilityEvaluation_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorEligibilityRuleResult" ADD CONSTRAINT "VendorEligibilityRuleResult_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "VendorEligibilityEvaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
