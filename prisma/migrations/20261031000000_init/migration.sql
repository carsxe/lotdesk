-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER', 'MANAGER', 'APPRAISER');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('IN_RECON', 'FRONTLINE', 'WHOLESALE', 'PENDING', 'SOLD');

-- CreateEnum
CREATE TYPE "ReconStage" AS ENUM ('INTAKE', 'MECHANICAL', 'BODY', 'DETAIL', 'PHOTOS', 'READY');

-- CreateEnum
CREATE TYPE "AppraisalStatus" AS ENUM ('DRAFT', 'OFFERED', 'ACCEPTED', 'DECLINED', 'STOCKED');

-- CreateEnum
CREATE TYPE "VehicleCondition" AS ENUM ('EXCELLENT', 'CLEAN', 'AVERAGE', 'ROUGH');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "demoMode" BOOLEAN NOT NULL DEFAULT true,
    "carsxeKeyCipher" TEXT,
    "carsxeKeyLast4" TEXT,
    "carsxeConnectedAt" TIMESTAMP(3),
    "carsxeAuthMethod" TEXT,
    "carsxeAccessTokenCipher" TEXT,
    "carsxeRefreshTokenCipher" TEXT,
    "carsxeTokenExpiresAt" TIMESTAMP(3),
    "cacheTtlHours" INTEGER NOT NULL DEFAULT 24,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rooftop" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip" TEXT,
    "agingThresholdDays" INTEGER NOT NULL DEFAULT 45,
    "targetTurnDays" INTEGER NOT NULL DEFAULT 45,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rooftop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "rooftopId" TEXT,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'APPRAISER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "rooftopId" TEXT NOT NULL,
    "vin" TEXT NOT NULL,
    "stockNumber" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "trim" TEXT,
    "bodyStyle" TEXT,
    "color" TEXT,
    "mileage" INTEGER NOT NULL,
    "costCents" INTEGER NOT NULL,
    "listPriceCents" INTEGER NOT NULL,
    "marketRetailCents" INTEGER,
    "marketWholesaleCents" INTEGER,
    "marketTradeInCents" INTEGER,
    "marketFetchedAt" TIMESTAMP(3),
    "status" "VehicleStatus" NOT NULL DEFAULT 'IN_RECON',
    "reconStage" "ReconStage" NOT NULL DEFAULT 'INTAKE',
    "acquiredAt" TIMESTAMP(3) NOT NULL,
    "soldAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appraisal" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "rooftopId" TEXT NOT NULL,
    "appraiserId" TEXT NOT NULL,
    "vin" TEXT NOT NULL,
    "plate" TEXT,
    "plateState" TEXT,
    "year" INTEGER,
    "make" TEXT,
    "model" TEXT,
    "trim" TEXT,
    "mileage" INTEGER NOT NULL,
    "condition" "VehicleCondition" NOT NULL DEFAULT 'CLEAN',
    "customerName" TEXT,
    "offerCents" INTEGER,
    "status" "AppraisalStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "marketRetailCents" INTEGER,
    "marketWholesaleCents" INTEGER,
    "marketTradeInCents" INTEGER,
    "marketAuctionCents" INTEGER,
    "brandCount" INTEGER NOT NULL DEFAULT 0,
    "recallCount" INTEGER NOT NULL DEFAULT 0,
    "hasOpenLien" BOOLEAN NOT NULL DEFAULT false,
    "hasTheftFlag" BOOLEAN NOT NULL DEFAULT false,
    "historySummary" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appraisal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiCache" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiUsage" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT,
    "endpoint" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "vin" TEXT,
    "billed" BOOLEAN NOT NULL,
    "cacheHit" BOOLEAN NOT NULL,
    "demo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Rooftop_organizationId_idx" ON "Rooftop"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");

-- CreateIndex
CREATE INDEX "Vehicle_organizationId_status_idx" ON "Vehicle"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Vehicle_rooftopId_idx" ON "Vehicle"("rooftopId");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_organizationId_vin_key" ON "Vehicle"("organizationId", "vin");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_organizationId_stockNumber_key" ON "Vehicle"("organizationId", "stockNumber");

-- CreateIndex
CREATE INDEX "Appraisal_organizationId_createdAt_idx" ON "Appraisal"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "Appraisal_rooftopId_idx" ON "Appraisal"("rooftopId");

-- CreateIndex
CREATE INDEX "ApiCache_expiresAt_idx" ON "ApiCache"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "ApiCache_organizationId_endpoint_cacheKey_key" ON "ApiCache"("organizationId", "endpoint", "cacheKey");

-- CreateIndex
CREATE INDEX "ApiUsage_organizationId_createdAt_idx" ON "ApiUsage"("organizationId", "createdAt");

-- AddForeignKey
ALTER TABLE "Rooftop" ADD CONSTRAINT "Rooftop_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_rooftopId_fkey" FOREIGN KEY ("rooftopId") REFERENCES "Rooftop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_rooftopId_fkey" FOREIGN KEY ("rooftopId") REFERENCES "Rooftop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appraisal" ADD CONSTRAINT "Appraisal_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appraisal" ADD CONSTRAINT "Appraisal_rooftopId_fkey" FOREIGN KEY ("rooftopId") REFERENCES "Rooftop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appraisal" ADD CONSTRAINT "Appraisal_appraiserId_fkey" FOREIGN KEY ("appraiserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiCache" ADD CONSTRAINT "ApiCache_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiUsage" ADD CONSTRAINT "ApiUsage_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiUsage" ADD CONSTRAINT "ApiUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
