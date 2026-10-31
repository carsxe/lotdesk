-- CreateEnum
CREATE TYPE "InventoryKind" AS ENUM ('USED', 'NEW');

-- CreateEnum
CREATE TYPE "ReconLineStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINED');

-- CreateEnum
CREATE TYPE "PhotoKind" AS ENUM ('RAW', 'CUTOUT', 'PROMO', 'SPIN');

-- CreateEnum
CREATE TYPE "IncentiveKind" AS ENUM ('REBATE', 'BONUS', 'APR');

-- CreateEnum
CREATE TYPE "SyndicationStatus" AS ENUM ('DRAFT', 'QUEUED', 'LIVE', 'ERROR', 'PAUSED');

-- CreateEnum
CREATE TYPE "InspectionSeverity" AS ENUM ('NOTE', 'MINOR', 'MAJOR');

-- AlterTable
ALTER TABLE "Rooftop" ADD COLUMN "holdingCostPerDayCents" INTEGER NOT NULL DEFAULT 3500;
ALTER TABLE "Rooftop" ADD COLUMN "targetUnitsPerModel" INTEGER NOT NULL DEFAULT 2;

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN "kind" "InventoryKind" NOT NULL DEFAULT 'USED';
ALTER TABLE "Vehicle" ADD COLUMN "segment" TEXT;
ALTER TABLE "Vehicle" ADD COLUMN "reconSpendCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Vehicle" ADD COLUMN "holdingCostPerDayCents" INTEGER NOT NULL DEFAULT 3500;
ALTER TABLE "Vehicle" ADD COLUMN "msrpCents" INTEGER;
ALTER TABLE "Vehicle" ADD COLUMN "invoiceCents" INTEGER;
ALTER TABLE "Vehicle" ADD COLUMN "description" TEXT;
ALTER TABLE "Vehicle" ADD COLUMN "aiDescription" TEXT;
ALTER TABLE "Vehicle" ADD COLUMN "photoPackReady" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Vehicle" ADD COLUMN "certified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Vehicle" ADD COLUMN "stageEnteredAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Appraisal" ADD COLUMN "walkAwayCents" INTEGER;
ALTER TABLE "Appraisal" ADD COLUMN "counterCents" INTEGER;

-- CreateTable
CREATE TABLE "IncentiveProgram" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT,
    "year" INTEGER,
    "amountCents" INTEGER NOT NULL,
    "kind" "IncentiveKind" NOT NULL DEFAULT 'REBATE',
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncentiveProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourcingCandidate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "vin" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "trim" TEXT,
    "segment" TEXT,
    "mileage" INTEGER NOT NULL,
    "askingCents" INTEGER NOT NULL,
    "sourceName" TEXT NOT NULL,
    "adapter" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SourcingCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReconLine" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "estimateCents" INTEGER NOT NULL,
    "status" "ReconLineStatus" NOT NULL DEFAULT 'PENDING',
    "vendor" TEXT,
    "stage" "ReconStage" NOT NULL DEFAULT 'MECHANICAL',
    "notes" TEXT,
    "approvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "ReconLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "kind" "PhotoKind" NOT NULL DEFAULT 'RAW',
    "url" TEXT NOT NULL,
    "overlay" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpinFrame" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "SpinFrame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inspection" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "appraisalId" TEXT,
    "vehicleId" TEXT,
    "grade" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'manual',
    "imageUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Inspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspectionTag" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "label" TEXT NOT NULL,
    "severity" "InspectionSeverity" NOT NULL DEFAULT 'MINOR',
    "notes" TEXT,

    CONSTRAINT "InspectionTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyndicationChannel" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "adapter" TEXT NOT NULL DEFAULT 'lotdesk-feed',
    "format" TEXT NOT NULL DEFAULT 'json',
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SyndicationChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyndicationListing" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "status" "SyndicationStatus" NOT NULL DEFAULT 'DRAFT',
    "lastSyncAt" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "SyndicationListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureFlag" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BetaFeedback" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "flagKey" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BetaFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IncentiveProgram_organizationId_make_idx" ON "IncentiveProgram"("organizationId", "make");

-- CreateIndex
CREATE INDEX "SourcingCandidate_organizationId_createdAt_idx" ON "SourcingCandidate"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "ReconLine_organizationId_status_idx" ON "ReconLine"("organizationId", "status");

-- CreateIndex
CREATE INDEX "ReconLine_vehicleId_idx" ON "ReconLine"("vehicleId");

-- CreateIndex
CREATE INDEX "Photo_vehicleId_idx" ON "Photo"("vehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "SpinFrame_vehicleId_index_key" ON "SpinFrame"("vehicleId", "index");

-- CreateIndex
CREATE INDEX "Inspection_organizationId_idx" ON "Inspection"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "SyndicationChannel_organizationId_slug_key" ON "SyndicationChannel"("organizationId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "SyndicationListing_vehicleId_channelId_key" ON "SyndicationListing"("vehicleId", "channelId");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureFlag_organizationId_key_key" ON "FeatureFlag"("organizationId", "key");

-- CreateIndex
CREATE INDEX "Vehicle_organizationId_kind_idx" ON "Vehicle"("organizationId", "kind");

-- AddForeignKey
ALTER TABLE "IncentiveProgram" ADD CONSTRAINT "IncentiveProgram_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourcingCandidate" ADD CONSTRAINT "SourcingCandidate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReconLine" ADD CONSTRAINT "ReconLine_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReconLine" ADD CONSTRAINT "ReconLine_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReconLine" ADD CONSTRAINT "ReconLine_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpinFrame" ADD CONSTRAINT "SpinFrame_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_appraisalId_fkey" FOREIGN KEY ("appraisalId") REFERENCES "Appraisal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionTag" ADD CONSTRAINT "InspectionTag_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyndicationChannel" ADD CONSTRAINT "SyndicationChannel_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyndicationListing" ADD CONSTRAINT "SyndicationListing_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyndicationListing" ADD CONSTRAINT "SyndicationListing_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "SyndicationChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeatureFlag" ADD CONSTRAINT "FeatureFlag_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BetaFeedback" ADD CONSTRAINT "BetaFeedback_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BetaFeedback" ADD CONSTRAINT "BetaFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
