"use server";

import { prisma } from "@/lib/prisma";
import { dollarsToCents } from "@/lib/money";
import { suggestedOfferCents } from "@/lib/pricing";
import { normalizeVin } from "@/lib/vin";
import { lookupDesk } from "@/server/carsxe";
import { getOrganization, requireUser } from "@/server/session";
import type { AppraisalStatus, VehicleCondition } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const lookupSchema = z.object({
  vin: z.string().optional(),
  plate: z.string().optional(),
  plateState: z.string().optional(),
  mileage: z.coerce.number().int().min(0).max(1_000_000).optional(),
  condition: z.enum(["excellent", "clean", "average", "rough"]).optional(),
  state: z.string().optional(),
});

export async function runDeskLookup(input: z.infer<typeof lookupSchema>) {
  const user = await requireUser();
  const org = await getOrganization(user.organizationId);
  const parsed = lookupSchema.parse(input);
  const vin = parsed.vin ? normalizeVin(parsed.vin) : undefined;
  return lookupDesk({
    org,
    userId: user.id,
    vin,
    plate: parsed.plate,
    plateState: parsed.plateState,
    mileage: parsed.mileage,
    condition: parsed.condition,
    state: parsed.state ?? org.rooftops.find((r) => r.id === user.rooftopId)?.state,
  });
}

const saveSchema = z.object({
  rooftopId: z.string(),
  vin: z.string().min(11).max(17),
  plate: z.string().optional(),
  plateState: z.string().optional(),
  year: z.coerce.number().int().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  trim: z.string().optional(),
  mileage: z.coerce.number().int().min(0),
  condition: z.enum(["EXCELLENT", "CLEAN", "AVERAGE", "ROUGH"]),
  customerName: z.string().optional(),
  offer: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["DRAFT", "OFFERED", "ACCEPTED", "DECLINED"]),
  marketRetailCents: z.coerce.number().optional(),
  marketWholesaleCents: z.coerce.number().optional(),
  marketTradeInCents: z.coerce.number().optional(),
  marketAuctionCents: z.coerce.number().optional(),
  brandCount: z.coerce.number().optional(),
  recallCount: z.coerce.number().optional(),
  hasOpenLien: z.enum(["true", "false"]).optional(),
  hasTheftFlag: z.enum(["true", "false"]).optional(),
  historySummary: z.string().optional(),
  payload: z.string().optional(),
});

export async function saveAppraisalAction(_prev: { error?: string } | null, formData: FormData) {
  const user = await requireUser();
  const parsed = saveSchema.safeParse({
    rooftopId: formData.get("rooftopId"),
    vin: formData.get("vin"),
    plate: formData.get("plate") || undefined,
    plateState: formData.get("plateState") || undefined,
    year: formData.get("year") || undefined,
    make: formData.get("make") || undefined,
    model: formData.get("model") || undefined,
    trim: formData.get("trim") || undefined,
    mileage: formData.get("mileage"),
    condition: formData.get("condition"),
    customerName: formData.get("customerName") || undefined,
    offer: formData.get("offer") || undefined,
    notes: formData.get("notes") || undefined,
    status: formData.get("status"),
    marketRetailCents: formData.get("marketRetailCents") || undefined,
    marketWholesaleCents: formData.get("marketWholesaleCents") || undefined,
    marketTradeInCents: formData.get("marketTradeInCents") || undefined,
    marketAuctionCents: formData.get("marketAuctionCents") || undefined,
    brandCount: formData.get("brandCount") || undefined,
    recallCount: formData.get("recallCount") || undefined,
    hasOpenLien: formData.get("hasOpenLien") || undefined,
    hasTheftFlag: formData.get("hasTheftFlag") || undefined,
    historySummary: formData.get("historySummary") || undefined,
    payload: formData.get("payload") || undefined,
  });
  if (!parsed.success) {
    return { error: "Missing required appraisal fields." };
  }

  const offerCents = parsed.data.offer ? dollarsToCents(parsed.data.offer) : suggestedOfferCents({
    marketTradeInCents: parsed.data.marketTradeInCents,
    marketWholesaleCents: parsed.data.marketWholesaleCents,
  });

  const appraisal = await prisma.appraisal.create({
    data: {
      organizationId: user.organizationId,
      rooftopId: parsed.data.rooftopId,
      appraiserId: user.id,
      vin: normalizeVin(parsed.data.vin),
      plate: parsed.data.plate,
      plateState: parsed.data.plateState,
      year: parsed.data.year,
      make: parsed.data.make,
      model: parsed.data.model,
      trim: parsed.data.trim,
      mileage: parsed.data.mileage,
      condition: parsed.data.condition as VehicleCondition,
      customerName: parsed.data.customerName,
      offerCents,
      status: parsed.data.status as AppraisalStatus,
      notes: parsed.data.notes,
      marketRetailCents: parsed.data.marketRetailCents,
      marketWholesaleCents: parsed.data.marketWholesaleCents,
      marketTradeInCents: parsed.data.marketTradeInCents,
      marketAuctionCents: parsed.data.marketAuctionCents,
      brandCount: parsed.data.brandCount ?? 0,
      recallCount: parsed.data.recallCount ?? 0,
      hasOpenLien: parsed.data.hasOpenLien === "true",
      hasTheftFlag: parsed.data.hasTheftFlag === "true",
      historySummary: parsed.data.historySummary,
      payload: parsed.data.payload ? JSON.parse(parsed.data.payload) : undefined,
    },
  });

  revalidatePath("/app/appraisals");
  revalidatePath("/app");
  return { id: appraisal.id };
}

export async function updateAppraisalStatus(id: string, status: AppraisalStatus) {
  const user = await requireUser();
  await prisma.appraisal.updateMany({
    where: { id, organizationId: user.organizationId },
    data: { status },
  });
  revalidatePath("/app/appraisals");
  revalidatePath(`/app/appraisals/${id}`);
}

export async function stockAppraisalAction(id: string) {
  const user = await requireUser();
  const appraisal = await prisma.appraisal.findFirst({
    where: { id, organizationId: user.organizationId },
  });
  if (!appraisal) return { error: "Appraisal not found." };

  const existing = await prisma.vehicle.findFirst({
    where: { organizationId: user.organizationId, vin: appraisal.vin },
  });
  if (existing) {
    await prisma.appraisal.update({ where: { id }, data: { status: "STOCKED" } });
    return { vehicleId: existing.id };
  }

  const count = await prisma.vehicle.count({ where: { organizationId: user.organizationId } });
  const vehicle = await prisma.vehicle.create({
    data: {
      organizationId: user.organizationId,
      rooftopId: appraisal.rooftopId,
      vin: appraisal.vin,
      stockNumber: `STK${String(count + 1).padStart(4, "0")}`,
      year: appraisal.year ?? 0,
      make: appraisal.make ?? "Unknown",
      model: appraisal.model ?? "Unknown",
      trim: appraisal.trim,
      mileage: appraisal.mileage,
      costCents: appraisal.offerCents ?? appraisal.marketWholesaleCents ?? 0,
      listPriceCents: appraisal.marketRetailCents ?? 0,
      marketRetailCents: appraisal.marketRetailCents,
      marketWholesaleCents: appraisal.marketWholesaleCents,
      marketTradeInCents: appraisal.marketTradeInCents,
      marketFetchedAt: new Date(),
      status: "IN_RECON",
      reconStage: "INTAKE",
      acquiredAt: new Date(),
    },
  });
  await prisma.appraisal.update({ where: { id }, data: { status: "STOCKED" } });
  revalidatePath("/app/inventory");
  revalidatePath("/app/appraisals");
  return { vehicleId: vehicle.id };
}
