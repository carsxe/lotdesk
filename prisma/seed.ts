import { PrismaClient, type Prisma } from "@prisma/client";
import { hash } from "bcryptjs";
import { FIXTURES } from "../src/lib/carsxe/fixtures";
import { adjustedBandValue } from "../src/lib/carsxe/types";
import { classifySegment } from "../src/lib/stocking";

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
    update: { holdingCostPerDayCents: 3500, targetUnitsPerModel: 2 },
    create: {
      id: "seed-rooftop-downtown",
      organizationId: org.id,
      name: "Harbor Downtown",
      city: "Portland",
      state: "OR",
      zip: "97209",
      agingThresholdDays: 45,
      targetTurnDays: 45,
      holdingCostPerDayCents: 3500,
      targetUnitsPerModel: 2,
    },
  });

  const westside = await prisma.rooftop.upsert({
    where: { id: "seed-rooftop-westside" },
    update: { holdingCostPerDayCents: 3800, targetUnitsPerModel: 2 },
    create: {
      id: "seed-rooftop-westside",
      organizationId: org.id,
      name: "Westside Imports",
      city: "Beaverton",
      state: "OR",
      zip: "97005",
      agingThresholdDays: 40,
      targetTurnDays: 40,
      holdingCostPerDayCents: 3800,
      targetUnitsPerModel: 2,
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
        kind: "USED",
        segment: classifySegment(pack.specs.attributes?.style, pack.specs.attributes?.model),
        reconSpendCents: unit.recon === "READY" ? 350_00 : 0,
        holdingCostPerDayCents: 3500,
        certified: unit.vin === "4T1G11AK1NU012345",
        photoPackReady: unit.status === "FRONTLINE",
        stageEnteredAt: daysAgo(Math.min(unit.days, 4)),
        description:
          unit.vin === "4T1G11AK1NU012345"
            ? "One-owner Camry SE with CarPlay and a clean CarsXE history. Priced to retail clean."
            : undefined,
      },
    });
  }

  const newUnits: Array<{
    vin: string;
    stock: string;
    year: number;
    make: string;
    model: string;
    trim: string;
    mileage: number;
    msrp: number;
    invoice: number;
    list: number;
  }> = [
    {
      vin: "4T1K61AK5SU701101",
      stock: "N-5101",
      year: 2025,
      make: "Toyota",
      model: "Camry",
      trim: "SE",
      mileage: 12,
      msrp: 30450,
      invoice: 28190,
      list: 29870,
    },
    {
      vin: "5FNRL6H70SB221208",
      stock: "N-5108",
      year: 2025,
      make: "Honda",
      model: "Odyssey",
      trim: "EX-L",
      mileage: 8,
      msrp: 42300,
      invoice: 39110,
      list: 41490,
    },
    {
      vin: "1FTFW1E89RFA33019",
      stock: "N-5119",
      year: 2026,
      make: "Ford",
      model: "F-150",
      trim: "XLT",
      mileage: 18,
      msrp: 51240,
      invoice: 47880,
      list: 49995,
    },
  ];

  for (const unit of newUnits) {
    await prisma.vehicle.upsert({
      where: { organizationId_vin: { organizationId: org.id, vin: unit.vin } },
      update: { kind: "NEW", msrpCents: unit.msrp * 100, invoiceCents: unit.invoice * 100 },
      create: {
        organizationId: org.id,
        rooftopId: downtown.id,
        vin: unit.vin,
        stockNumber: unit.stock,
        year: unit.year,
        make: unit.make,
        model: unit.model,
        trim: unit.trim,
        mileage: unit.mileage,
        costCents: unit.invoice * 100,
        listPriceCents: unit.list * 100,
        msrpCents: unit.msrp * 100,
        invoiceCents: unit.invoice * 100,
        status: "FRONTLINE",
        reconStage: "READY",
        acquiredAt: daysAgo(9),
        kind: "NEW",
        segment: classifySegment(unit.model, unit.model),
        photoPackReady: true,
        stageEnteredAt: daysAgo(2),
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
      walkAwayCents: 14800_00,
      counterCents: 13600_00,
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
      walkAwayCents: 3600_00,
      counterCents: 3000_00,
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

  await prisma.incentiveProgram.deleteMany({ where: { organizationId: org.id } });
  await prisma.sourcingCandidate.deleteMany({ where: { organizationId: org.id } });
  await prisma.reconLine.deleteMany({ where: { organizationId: org.id } });
  await prisma.photo.deleteMany({ where: { organizationId: org.id } });
  await prisma.inspection.deleteMany({ where: { organizationId: org.id } });
  await prisma.syndicationListing.deleteMany({ where: { channel: { organizationId: org.id } } });
  await prisma.syndicationChannel.deleteMany({ where: { organizationId: org.id } });
  await prisma.featureFlag.deleteMany({ where: { organizationId: org.id } });
  await prisma.betaFeedback.deleteMany({ where: { organizationId: org.id } });
  await prisma.spinFrame.deleteMany({
    where: { vehicle: { organizationId: org.id } },
  });

  const camry = await prisma.vehicle.findFirstOrThrow({
    where: { organizationId: org.id, vin: "4T1G11AK1NU012345" },
  });
  const crv = await prisma.vehicle.findFirstOrThrow({
    where: { organizationId: org.id, vin: "2HKRW2H59MH123456" },
  });
  const bmw = await prisma.vehicle.findFirstOrThrow({
    where: { organizationId: org.id, vin: "WBA5R1C50LAF22331" },
  });
  const jeep = await prisma.vehicle.findFirstOrThrow({
    where: { organizationId: org.id, vin: "1C4JJXR64PW696340" },
  });
  const dodge = await prisma.vehicle.findFirstOrThrow({
    where: { organizationId: org.id, vin: "2C3CDXFG1FH762860" },
  });
  const suburban = await prisma.vehicle.findFirstOrThrow({
    where: { organizationId: org.id, vin: "1GNSCGKC0JR318026" },
  });
  const bmwAppraisal = await prisma.appraisal.findFirstOrThrow({
    where: { organizationId: org.id, vin: "WBAFR7C57CC811956" },
  });

  await prisma.incentiveProgram.createMany({
    data: [
      { organizationId: org.id, name: "College grad rebate", make: "Toyota", model: "Camry", year: 2025, amountCents: 500_00, kind: "REBATE", source: "MANUAL" },
      { organizationId: org.id, name: "Military bonus", make: "Honda", model: "Odyssey", year: 2025, amountCents: 750_00, kind: "BONUS", source: "MANUAL" },
      { organizationId: org.id, name: "APR 3.9%", make: "Ford", model: "F-150", year: 2026, amountCents: 0, kind: "APR", source: "IMPORT" },
    ],
  });

  await prisma.sourcingCandidate.createMany({
    data: [
      { organizationId: org.id, vin: "1HGCV1F34JA200145", year: 2018, make: "Honda", model: "Accord", trim: "EX-L", segment: "Car", mileage: 41200, askingCents: 14200_00, sourceName: "Lane 12", adapter: "csv" },
      { organizationId: org.id, vin: "2T3P1RFV5MW167890", year: 2021, make: "Toyota", model: "RAV4", trim: "XLE", segment: "SUV", mileage: 28750, askingCents: 22100_00, sourceName: "Marketplace", adapter: "csv" },
      { organizationId: org.id, vin: "4T1G11AK8NU088221", year: 2022, make: "Toyota", model: "Camry", trim: "LE", segment: "Car", mileage: 33410, askingCents: 19800_00, sourceName: "Closed sale", adapter: "csv" },
    ],
  });

  await prisma.reconLine.createMany({
    data: [
      { organizationId: org.id, vehicleId: bmw.id, title: "Brake job", category: "Mechanical", estimateCents: 640_00, status: "PENDING", vendor: "Metro Brakes", stage: "MECHANICAL" },
      { organizationId: org.id, vehicleId: bmw.id, title: "Oil + filters", category: "Mechanical", estimateCents: 180_00, status: "APPROVED", vendor: "In-house", stage: "MECHANICAL", approvedById: owner.id, decidedAt: daysAgo(1) },
      { organizationId: org.id, vehicleId: jeep.id, title: "Rockers rust treat", category: "Body", estimateCents: 920_00, status: "PENDING", vendor: "Westside Body", stage: "BODY" },
      { organizationId: org.id, vehicleId: dodge.id, title: "Detail + odor", category: "Detail", estimateCents: 275_00, status: "APPROVED", vendor: "Shine Co", stage: "DETAIL", approvedById: owner.id, decidedAt: daysAgo(2) },
      { organizationId: org.id, vehicleId: dodge.id, title: "Windshield chip", category: "Glass", estimateCents: 90_00, status: "DECLINED", vendor: "GlassPro", stage: "BODY", approvedById: owner.id, decidedAt: daysAgo(2) },
    ],
  });
  await prisma.vehicle.update({ where: { id: bmw.id }, data: { reconSpendCents: 180_00 } });
  await prisma.vehicle.update({ where: { id: dodge.id }, data: { reconSpendCents: 275_00 } });

  const demoPhoto = (v: { year: number; make: string; model: string }, extra = "") =>
    `/api/demo-image?year=${v.year}&make=${encodeURIComponent(v.make)}&model=${encodeURIComponent(v.model)}${extra}`;

  await prisma.photo.createMany({
    data: [
      { organizationId: org.id, vehicleId: camry.id, kind: "RAW", url: demoPhoto(camry, "&angle=front") },
      { organizationId: org.id, vehicleId: camry.id, kind: "CUTOUT", url: demoPhoto(camry, "&angle=side&studio=showroom") },
      { organizationId: org.id, vehicleId: camry.id, kind: "PROMO", url: demoPhoto(camry, "&angle=front&studio=showroom&overlay=cpo"), overlay: "cpo" },
      { organizationId: org.id, vehicleId: crv.id, kind: "RAW", url: demoPhoto(crv, "&angle=side") },
      { organizationId: org.id, vehicleId: suburban.id, kind: "RAW", url: demoPhoto(suburban, "&angle=front") },
    ],
  });

  await prisma.spinFrame.createMany({
    data: Array.from({ length: 12 }, (_, index) => ({
      vehicleId: camry.id,
      index,
      url: demoPhoto(camry, `&angle=spin-${index}&studio=showroom`),
    })),
  });

  await prisma.inspection.create({
    data: {
      organizationId: org.id,
      appraisalId: bmwAppraisal.id,
      grade: "ROUGH",
      provider: "manual",
      imageUrl: demoPhoto({ year: 2012, make: "BMW", model: "5-Series" }, "&angle=front"),
      notes: "Curb rash passenger front. Hood chip field.",
      tags: {
        create: [
          { x: 0.28, y: 0.62, label: "Curb rash", severity: "MINOR" },
          { x: 0.52, y: 0.4, label: "Hood chips", severity: "NOTE" },
        ],
      },
    },
  });

  const website = await prisma.syndicationChannel.create({
    data: { organizationId: org.id, name: "Dealer website", slug: "website", adapter: "lotdesk-feed", format: "json" },
  });
  const market = await prisma.syndicationChannel.create({
    data: { organizationId: org.id, name: "Marketplace CSV", slug: "marketplace", adapter: "lotdesk-feed", format: "csv" },
  });
  await prisma.syndicationChannel.create({
    data: { organizationId: org.id, name: "Partner XML", slug: "partner", adapter: "lotdesk-feed", format: "xml" },
  });
  await prisma.syndicationListing.createMany({
    data: [
      { vehicleId: camry.id, channelId: website.id, status: "LIVE", lastSyncAt: daysAgo(0) },
      { vehicleId: crv.id, channelId: website.id, status: "LIVE", lastSyncAt: daysAgo(0) },
      { vehicleId: suburban.id, channelId: website.id, status: "PAUSED" },
      { vehicleId: camry.id, channelId: market.id, status: "LIVE", lastSyncAt: daysAgo(1) },
    ],
  });

  await prisma.featureFlag.createMany({
    data: [
      { organizationId: org.id, key: "lot-assistant", enabled: true },
      { organizationId: org.id, key: "promo-studio", enabled: true },
      { organizationId: org.id, key: "spin-view", enabled: true },
      { organizationId: org.id, key: "condition-book", enabled: true },
    ],
  });
  await prisma.betaFeedback.create({
    data: {
      organizationId: org.id,
      userId: owner.id,
      flagKey: "lot-assistant",
      rating: 5,
      comment: "Repricing 60+ day units from chat is the move.",
    },
  });

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
