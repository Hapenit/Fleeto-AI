-- CreateEnum
CREATE TYPE "MatchFactorStatus" AS ENUM ('PASS', 'PARTIAL', 'WEAK', 'NOT_AVAILABLE');

-- CreateEnum
CREATE TYPE "RankingEvaluationStatus" AS ENUM ('RANKED', 'EXCLUDED', 'NEEDS_REVIEW');

-- CreateEnum
CREATE TYPE "RankingRunStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "OutreachSelectionStatus" AS ENUM ('SELECTED', 'REMOVED');

-- CreateTable
CREATE TABLE "VendorRankingWeightConfiguration" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "routeWeight" DOUBLE PRECISION NOT NULL DEFAULT 25,
    "vehicleWeight" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "capacityWeight" DOUBLE PRECISION NOT NULL DEFAULT 15,
    "cargoWeight" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "availabilityWeight" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "serviceCoverageWeight" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "performanceWeight" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "commercialWeight" DOUBLE PRECISION NOT NULL DEFAULT 3,
    "communicationWeight" DOUBLE PRECISION NOT NULL DEFAULT 2,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorRankingWeightConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorRankingRun" (
    "id" TEXT NOT NULL,
    "runNumber" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "engineVersion" TEXT NOT NULL,
    "weightConfigurationVersion" TEXT NOT NULL,
    "candidateCount" INTEGER NOT NULL DEFAULT 0,
    "rankedCount" INTEGER NOT NULL DEFAULT 0,
    "excludedCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "status" "RankingRunStatus" NOT NULL DEFAULT 'QUEUED',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorRankingRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorRankingEvaluation" (
    "id" TEXT NOT NULL,
    "rankingNumber" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "eligibilityEvaluationId" TEXT,
    "rank" INTEGER,
    "score" DOUBLE PRECISION,
    "scorePercentage" DOUBLE PRECISION,
    "status" "RankingEvaluationStatus" NOT NULL,
    "engineVersion" TEXT NOT NULL,
    "weightConfigurationVersion" TEXT NOT NULL,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorRankingEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorMatchFactorResult" (
    "id" TEXT NOT NULL,
    "rankingEvaluationId" TEXT NOT NULL,
    "factorCode" TEXT NOT NULL,
    "factorName" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "rawScore" DOUBLE PRECISION NOT NULL,
    "normalizedScore" DOUBLE PRECISION NOT NULL,
    "status" "MatchFactorStatus" NOT NULL,
    "reason" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorMatchFactorResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorOutreachSelection" (
    "id" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "rankingEvaluationId" TEXT,
    "status" "OutreachSelectionStatus" NOT NULL DEFAULT 'SELECTED',
    "notes" TEXT,
    "selectedById" TEXT NOT NULL,
    "selectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorOutreachSelection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VendorRankingWeightConfiguration_version_key" ON "VendorRankingWeightConfiguration"("version");

-- CreateIndex
CREATE UNIQUE INDEX "VendorRankingRun_runNumber_key" ON "VendorRankingRun"("runNumber");

-- CreateIndex
CREATE INDEX "VendorRankingRun_requirementId_idx" ON "VendorRankingRun"("requirementId");

-- CreateIndex
CREATE UNIQUE INDEX "VendorRankingEvaluation_rankingNumber_key" ON "VendorRankingEvaluation"("rankingNumber");

-- CreateIndex
CREATE INDEX "VendorRankingEvaluation_runId_idx" ON "VendorRankingEvaluation"("runId");

-- CreateIndex
CREATE INDEX "VendorRankingEvaluation_requirementId_idx" ON "VendorRankingEvaluation"("requirementId");

-- CreateIndex
CREATE INDEX "VendorRankingEvaluation_vendorId_idx" ON "VendorRankingEvaluation"("vendorId");

-- CreateIndex
CREATE INDEX "VendorRankingEvaluation_rank_idx" ON "VendorRankingEvaluation"("rank");

-- CreateIndex
CREATE INDEX "VendorRankingEvaluation_score_idx" ON "VendorRankingEvaluation"("score");

-- CreateIndex
CREATE INDEX "VendorMatchFactorResult_rankingEvaluationId_idx" ON "VendorMatchFactorResult"("rankingEvaluationId");

-- CreateIndex
CREATE INDEX "VendorMatchFactorResult_factorCode_idx" ON "VendorMatchFactorResult"("factorCode");

-- CreateIndex
CREATE INDEX "VendorOutreachSelection_requirementId_idx" ON "VendorOutreachSelection"("requirementId");

-- CreateIndex
CREATE INDEX "VendorOutreachSelection_vendorId_idx" ON "VendorOutreachSelection"("vendorId");

-- AddForeignKey
ALTER TABLE "VendorRankingWeightConfiguration" ADD CONSTRAINT "VendorRankingWeightConfiguration_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorRankingRun" ADD CONSTRAINT "VendorRankingRun_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "Requirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorRankingRun" ADD CONSTRAINT "VendorRankingRun_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorRankingEvaluation" ADD CONSTRAINT "VendorRankingEvaluation_runId_fkey" FOREIGN KEY ("runId") REFERENCES "VendorRankingRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorRankingEvaluation" ADD CONSTRAINT "VendorRankingEvaluation_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "Requirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorRankingEvaluation" ADD CONSTRAINT "VendorRankingEvaluation_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorMatchFactorResult" ADD CONSTRAINT "VendorMatchFactorResult_rankingEvaluationId_fkey" FOREIGN KEY ("rankingEvaluationId") REFERENCES "VendorRankingEvaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorOutreachSelection" ADD CONSTRAINT "VendorOutreachSelection_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "Requirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorOutreachSelection" ADD CONSTRAINT "VendorOutreachSelection_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorOutreachSelection" ADD CONSTRAINT "VendorOutreachSelection_selectedById_fkey" FOREIGN KEY ("selectedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
