import { PrismaClient, type Prisma } from "@prisma/client";
import { hash } from "bcryptjs";
import { FIXTURES } from "../src/lib/carsxe/fixtures";
import { adjustedBandValue } from "../src/lib/carsxe/types";

const prisma = new PrismaClient();

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 86_400_000);
}

function marketCents(vin: string) {
  const pack = FIXTURES[vin];
  return {
    retail: Math.round((adjustedBandValue(pack.marketValue.retail_clean, "retail_clean") ?? 0) * 100),
    wholesale: Math.round((adjustedBandValue(pack.marketValue.whole_clean, "whole_clean") ?? 0) * 100),
    trade: Math.round((adjustedBandValue(pack.marketValue.trade_in_clean, "trade_in_clean") ?? 0) * 100),
  };
}

async function main() {
  const passwordHash = await hash("lotdesk-demo", 12);

  const org = await prisma.organization.upsert({
    where: { slug: "harbor-automotive" },
    update: { demoMode: true, name: "Harbor Automotive Group" },
    create: {
      name: "Harbor Automotive Group",
      slug: "harbor-automotive",
      demoMode: true,
      cacheTtlHours: 24,
    },
  });

  const downtown = await prisma.rooftop.upsert({
    where: { id: "seed-rooftop-downtown" },
    update: {},
    create: {
      id: "seed-rooftop-downtown",
      organizationId: org.id,
      name: "Harbor Downtown",
      city: "Portland",
      state: "OR",
      zip: "97209",
      agingThresholdDays: 45,
      targetTurnDays: 45,
    },
  });

  const westside = await prisma.rooftop.upsert({
    where: { id: "seed-rooftop-westside" },
    update: {},
    create: {
      id: "seed-rooftop-westside",
      organizationId: org.id,
      name: "Westside Imports",
      city: "Beaverton",
      state: "OR",
      zip: "97005",
      agingThresholdDays: 40,
      targetTurnDays: 40,
    },
  });

  const owner = await prisma.user.upsert({
    where: { email: "demo@lotdesk.dev" },
    update: { passwordHash, organizationId: org.id, rooftopId: downtown.id },
    create: {
      email: "demo@lotdesk.dev",
      name: "Alex Rivera",
      passwordHash,
      role: "OWNER",
      organizationId: org.id,
      rooftopId: downtown.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "manager@lotdesk.dev" },
    update: { passwordHash, organizationId: org.id, rooftopId: downtown.id },
    create: {
      email: "manager@lotdesk.dev",
      name: "Jordan Hale",
      passwordHash,
      role: "MANAGER",
      organizationId: org.id,
      rooftopId: downtown.id,
    },
  });

  const appraiser = await prisma.user.upsert({
    where: { email: "appraiser@lotdesk.dev" },
    update: { passwordHash, organizationId: org.id, rooftopId: westside.id },
    create: {
      email: "appraiser@lotdesk.dev",
      name: "Sam Okonkwo",
      passwordHash,
      role: "APPRAISER",
      organizationId: org.id,
      rooftopId: westside.id,
    },
  });

  const units: Array<{
    vin: string;
    stock: string;
    rooftopId: string;
    mileage: number;
    cost: number;
    list: number;
    days: number;
    status: "IN_RECON" | "FRONTLINE" | "WHOLESALE";
    recon: "INTAKE" | "MECHANICAL" | "BODY" | "DETAIL" | "PHOTOS" | "READY";
    notes?: string;
  }> = [
    {
      vin: "4T1G11AK1NU012345",
      stock: "H-2204",
      rooftopId: downtown.id,
      mileage: 18440,
      cost: 21400,
      list: 24900,
      days: 12,
      status: "FRONTLINE",
      recon: "READY",
    },
    {
      vin: "2HKRW2H59MH123456",
      stock: "H-2148",
      rooftopId: downtown.id,
      mileage: 41200,
      cost: 19100,
      list: 25900,
      days: 48,
      status: "FRONTLINE",
      recon: "READY",
      notes: "Aged. Price is above CarsXE retail clean.",
    },
    {
      vin: "1FTEW1E49KFA77821",
      stock: "H-1988",
      rooftopId: downtown.id,
      mileage: 61220,
      cost: 23800,
      list: 26900,
      days: 22,
      status: "FRONTLINE",
      recon: "READY",
    },
    {
      vin: "WBA5R1C50LAF22331",
      stock: "W-3310",
      rooftopId: westside.id,
      mileage: 28900,
      cost: 22100,
      list: 26800,
      days: 8,
      status: "IN_RECON",
      recon: "MECHANICAL",
    },
    {
      vin: "1GNSCGKC0JR318026",
      stock: "H-1762",
      rooftopId: downtown.id,
      mileage: 88410,
      cost: 16800,
      list: 21900,
      days: 61,
      status: "WHOLESALE",
      recon: "READY",
      notes: "Prior fleet. Move if it does not retail this week.",
    },
    {
      vin: "1C4JJXR64PW696340",
      stock: "W-3401",
      rooftopId: westside.id,
      mileage: 8120,
      cost: 36200,
      list: 41800,
      days: 5,
      status: "IN_RECON",
      recon: "INTAKE",
    },
    {
      vin: "3KPFK4A78HE103497",
      stock: "H-1049",
      rooftopId: downtown.id,
      mileage: 71225,
      cost: 5100,
      list: 9200,
      days: 35,
      status: "FRONTLINE",
      recon: "READY",
    },
    {
      vin: "2C3CDXFG1FH762860",
      stock: "W-2860",
      rooftopId: westside.id,
      mileage: 97800,
      cost: 6200,
      list: 9800,
      days: 19,
      status: "IN_RECON",
      recon: "DETAIL",
      notes: "Salvage/rebuilt history. Wholesale unless recon stays cheap.",
    },
  ];

  for (const unit of units) {
    const m = marketCents(unit.vin);
    const pack = FIXTURES[unit.vin];
    await prisma.vehicle.upsert({
      where: { organizationId_vin: { organizationId: org.id, vin: unit.vin } },
      update: {
        listPriceCents: unit.list * 100,
        costCents: unit.cost * 100,
        status: unit.status,
        reconStage: unit.recon,
      },
      create: {
        organizationId: org.id,
        rooftopId: unit.rooftopId,
        vin: unit.vin,
        stockNumber: unit.stock,
        year: Number(pack.specs.attributes?.year ?? 0),
        make: pack.specs.attributes?.make ?? "Unknown",
        model: pack.specs.attributes?.model ?? "Unknown",
        trim: pack.specs.attributes?.trim,
        bodyStyle: pack.specs.attributes?.style,
        color: pack.specs.colors?.find((c) => c.category === "Exterior")?.name,
        mileage: unit.mileage,
        costCents: unit.cost * 100,
        listPriceCents: unit.list * 100,
        marketRetailCents: m.retail,
        marketWholesaleCents: m.wholesale,
        marketTradeInCents: m.trade,
        marketFetchedAt: new Date(),
        status: unit.status,
        reconStage: unit.recon,
        acquiredAt: daysAgo(unit.days),
        notes: unit.notes,
      },
    });
  }

  await prisma.appraisal.deleteMany({ where: { organizationId: org.id } });

  const appraisals: Prisma.AppraisalCreateManyInput[] = [
    {
      organizationId: org.id,
      rooftopId: downtown.id,
      appraiserId: owner.id,
      vin: "1HGCV1F34JA200145",
      year: 2018,
      make: "Honda",
      model: "Accord",
      trim: "EX-L",
      mileage: 41200,
      condition: "CLEAN",
      customerName: "Priya Shah",
      offerCents: 13200_00,
      status: "OFFERED",
      marketRetailCents: 17600_00,
      marketWholesaleCents: 14200_00,
      marketTradeInCents: 12900_00,
      brandCount: 0,
      recallCount: 0,
      historySummary: "No title brands, liens, theft flags, or open recalls on file",
    },
    {
      organizationId: org.id,
      rooftopId: westside.id,
      appraiserId: appraiser.id,
      vin: "WBAFR7C57CC811956",
      year: 2012,
      make: "BMW",
      model: "5-Series",
      trim: "535i",
      mileage: 98400,
      condition: "ROUGH",
      customerName: "Chris Nguyen",
      offerCents: 2800_00,
      status: "DECLINED",
      marketRetailCents: 9800_00,
      marketWholesaleCents: 6200_00,
      marketTradeInCents: 5400_00,
      brandCount: 2,
      recallCount: 1,
      hasOpenLien: true,
      hasTheftFlag: false,
      historySummary: "2 title brands · junk/salvage record · open lien · 1 open recall",
      notes: "Walk. Salvage brand plus open lien.",
    },
    {
      organizationId: org.id,
      rooftopId: downtown.id,
      appraiserId: owner.id,
      vin: "2T3P1RFV5MW167890",
      year: 2021,
      make: "Toyota",
      model: "RAV4",
      trim: "XLE",
      mileage: 28750,
      condition: "CLEAN",
      customerName: "Elena Vasquez",
      offerCents: 21400_00,
      status: "ACCEPTED",
      marketRetailCents: 26100_00,
      marketWholesaleCents: 22600_00,
      marketTradeInCents: 20900_00,
      brandCount: 0,
      recallCount: 0,
      historySummary: "No title brands, liens, theft flags, or open recalls on file",
    },
    {
      organizationId: org.id,
      rooftopId: downtown.id,
      appraiserId: appraiser.id,
      vin: "1GNSCGKC0JR318026",
      plate: "H37SFS",
      plateState: "NJ",
      year: 2018,
      make: "Chevrolet",
      model: "Suburban",
      trim: "LS",
      mileage: 88410,
      condition: "AVERAGE",
      customerName: "Walk-in",
      status: "DRAFT",
      marketRetailCents: 22900_00,
      marketWholesaleCents: 18400_00,
      marketTradeInCents: 16800_00,
      brandCount: 1,
      recallCount: 0,
      historySummary: "1 title brand",
    },
  ];

  await prisma.appraisal.createMany({ data: appraisals });

  await prisma.apiUsage.deleteMany({ where: { organizationId: org.id } });
  await prisma.apiUsage.createMany({
    data: [
      { organizationId: org.id, userId: owner.id, endpoint: "specs", action: "Decode VIN", vin: "4T1G11AK1NU012345", billed: false, cacheHit: false, demo: true, createdAt: daysAgo(2) },
      { organizationId: org.id, userId: owner.id, endpoint: "marketvalue", action: "Market value", vin: "4T1G11AK1NU012345", billed: false, cacheHit: false, demo: true, createdAt: daysAgo(2) },
      { organizationId: org.id, userId: owner.id, endpoint: "history", action: "History + title", vin: "4T1G11AK1NU012345", billed: false, cacheHit: true, demo: true, createdAt: daysAgo(1) },
      { organizationId: org.id, userId: appraiser.id, endpoint: "us-plate-decoder", action: "Decode plate", vin: "1GNSCGKC0JR318026", billed: false, cacheHit: false, demo: true, createdAt: daysAgo(1) },
      { organizationId: org.id, userId: appraiser.id, endpoint: "recalls", action: "Recall check", vin: "WBAFR7C57CC811956", billed: false, cacheHit: false, demo: true, createdAt: daysAgo(0) },
    ],
  });

  console.log("Seeded Harbor Automotive Group. Login demo@lotdesk.dev / lotdesk-demo");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
