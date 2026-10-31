"use server";

import { prisma } from "@/lib/prisma";
import { parseInventoryCsv } from "@/lib/csv";
import { dollarsToCents } from "@/lib/money";
import { normalizeVin } from "@/lib/vin";
import { lookupDesk } from "@/server/carsxe";
import { getOrganization, requireRole, requireUser } from "@/server/session";
import type { ReconStage, VehicleStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createSchema = z.object({
  rooftopId: z.string(),
  vin: z.string().min(11),
  stockNumber: z.string().min(1),
  mileage: z.coerce.number().int().min(0),
  cost: z.string(),
  listPrice: z.string(),
  notes: z.string().optional(),
});

export async function createVehicleAction(_prev: { error?: string } | null, formData: FormData) {
  const user = await requireRole(["OWNER", "MANAGER"]);
  const org = await getOrganization(user.organizationId);
  const parsed = createSchema.safeParse({
    rooftopId: formData.get("rooftopId"),
    vin: formData.get("vin"),
    stockNumber: formData.get("stockNumber"),
    mileage: formData.get("mileage"),
    cost: formData.get("cost"),
    listPrice: formData.get("listPrice"),
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return { error: "VIN, stock number, mileage, cost, and list price are required." };

  const vin = normalizeVin(parsed.data.vin);
  const exists = await prisma.vehicle.findFirst({
    where: { organizationId: user.organizationId, vin },
  });
  if (exists) return { error: "That VIN is already in inventory." };

  const lookup = await lookupDesk({
    org,
    userId: user.id,
    vin,
    mileage: parsed.data.mileage,
    state: org.rooftops.find((r) => r.id === parsed.data.rooftopId)?.state,
  });

  const vehicle = await prisma.vehicle.create({
    data: {
      organizationId: user.organizationId,
      rooftopId: parsed.data.rooftopId,
      vin,
      stockNumber: parsed.data.stockNumber,
      year: Number(lookup.summary.year) || 0,
      make: lookup.summary.make ?? "Unknown",
      model: lookup.summary.model ?? "Unknown",
      trim: lookup.summary.trim,
      bodyStyle: lookup.summary.bodyStyle,
      color: lookup.summary.color,
      mileage: parsed.data.mileage,
      costCents: dollarsToCents(parsed.data.cost),
      listPriceCents: dollarsToCents(parsed.data.listPrice),
      marketRetailCents: lookup.summary.retailCents,
      marketWholesaleCents: lookup.summary.wholesaleCents,
      marketTradeInCents: lookup.summary.tradeInCents,
      marketFetchedAt: new Date(),
      status: "IN_RECON",
      reconStage: "INTAKE",
      acquiredAt: new Date(),
      notes: parsed.data.notes,
    },
  });

  revalidatePath("/app/inventory");
  revalidatePath("/app/pricing");
  revalidatePath("/app");
  return { id: vehicle.id };
}

export async function updateVehicleAction(formData: FormData) {
  const user = await requireRole(["OWNER", "MANAGER"]);
  const id = String(formData.get("id") ?? "");
  await prisma.vehicle.updateMany({
    where: { id, organizationId: user.organizationId },
    data: {
      stockNumber: String(formData.get("stockNumber") ?? ""),
      mileage: Number(formData.get("mileage") ?? 0),
      costCents: dollarsToCents(String(formData.get("cost") ?? "0")),
      listPriceCents: dollarsToCents(String(formData.get("listPrice") ?? "0")),
      status: String(formData.get("status") ?? "FRONTLINE") as VehicleStatus,
      reconStage: String(formData.get("reconStage") ?? "READY") as ReconStage,
      rooftopId: String(formData.get("rooftopId") ?? ""),
      notes: String(formData.get("notes") ?? "") || null,
    },
  });
  revalidatePath("/app/inventory");
  revalidatePath(`/app/inventory/${id}`);
  revalidatePath("/app/pricing");
}

export async function applySuggestedPrice(id: string, listPriceCents: number) {
  const user = await requireRole(["OWNER", "MANAGER"]);
  await prisma.vehicle.updateMany({
    where: { id, organizationId: user.organizationId },
    data: { listPriceCents },
  });
  revalidatePath("/app/pricing");
  revalidatePath("/app/inventory");
}

export async function refreshVehicleMarket(id: string) {
  const user = await requireUser();
  const org = await getOrganization(user.organizationId);
  const vehicle = await prisma.vehicle.findFirst({
    where: { id, organizationId: user.organizationId },
    include: { rooftop: true },
  });
  if (!vehicle) return { error: "Vehicle not found." };

  const lookup = await lookupDesk({
    org,
    userId: user.id,
    vin: vehicle.vin,
    mileage: vehicle.mileage,
    state: vehicle.rooftop.state,
  });

  await prisma.vehicle.update({
    where: { id },
    data: {
      year: Number(lookup.summary.year) || vehicle.year,
      make: lookup.summary.make ?? vehicle.make,
      model: lookup.summary.model ?? vehicle.model,
      trim: lookup.summary.trim ?? vehicle.trim,
      bodyStyle: lookup.summary.bodyStyle ?? vehicle.bodyStyle,
      color: lookup.summary.color ?? vehicle.color,
      marketRetailCents: lookup.summary.retailCents,
      marketWholesaleCents: lookup.summary.wholesaleCents,
      marketTradeInCents: lookup.summary.tradeInCents,
      marketFetchedAt: new Date(),
    },
  });
  revalidatePath(`/app/inventory/${id}`);
  revalidatePath("/app/pricing");
  return { ok: true };
}

export async function importInventoryCsv(formData: FormData) {
  const user = await requireRole(["OWNER", "MANAGER"]);
  const org = await getOrganization(user.organizationId);
  const file = formData.get("file");
  const defaultRooftopId = String(formData.get("rooftopId") ?? org.rooftops[0]?.id ?? "");
  if (!(file instanceof File)) return { error: "Upload a CSV file.", created: 0, failed: 0 };

  const text = await file.text();
  const rows = parseInventoryCsv(text);
  let created = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const row of rows) {
    const vin = normalizeVin(row.vin ?? "");
    if (vin.length !== 17) {
      failed += 1;
      errors.push(`${row.vin || "(empty)"}: invalid VIN`);
      continue;
    }
    const exists = await prisma.vehicle.findFirst({
      where: { organizationId: user.organizationId, vin },
    });
    if (exists) {
      failed += 1;
      errors.push(`${vin}: already in inventory`);
      continue;
    }

    const rooftop =
      org.rooftops.find((item) => item.name.toLowerCase() === row.rooftop?.toLowerCase()) ??
      org.rooftops.find((item) => item.id === defaultRooftopId) ??
      org.rooftops[0];
    if (!rooftop) {
      failed += 1;
      continue;
    }

    try {
      const lookup = await lookupDesk({
        org,
        userId: user.id,
        vin,
        mileage: row.mileage,
        state: rooftop.state,
      });
      const count = await prisma.vehicle.count({ where: { organizationId: user.organizationId } });
      await prisma.vehicle.create({
        data: {
          organizationId: user.organizationId,
          rooftopId: rooftop.id,
          vin,
          stockNumber: row.stockNumber || `STK${String(count + 1).padStart(4, "0")}`,
          year: Number(lookup.summary.year) || 0,
          make: lookup.summary.make ?? "Unknown",
          model: lookup.summary.model ?? "Unknown",
          trim: lookup.summary.trim,
          bodyStyle: lookup.summary.bodyStyle,
          color: lookup.summary.color,
          mileage: row.mileage ?? 0,
          costCents: dollarsToCents(row.cost ?? 0),
          listPriceCents: dollarsToCents(row.listPrice ?? lookup.summary.retailCents ?? 0),
          marketRetailCents: lookup.summary.retailCents,
          marketWholesaleCents: lookup.summary.wholesaleCents,
          marketTradeInCents: lookup.summary.tradeInCents,
          marketFetchedAt: new Date(),
          status: "IN_RECON",
          reconStage: "INTAKE",
          acquiredAt: row.acquiredAt ? new Date(row.acquiredAt) : new Date(),
        },
      });
      created += 1;
    } catch (error) {
      failed += 1;
      errors.push(`${vin}: ${error instanceof Error ? error.message : "lookup failed"}`);
    }
  }

  revalidatePath("/app/inventory");
  revalidatePath("/app");
  return { created, failed, errors: errors.slice(0, 8) };
}
