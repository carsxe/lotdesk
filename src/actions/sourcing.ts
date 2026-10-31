"use server";

import { getSourceAdapter } from "@/lib/adapters/source";
import { classifySegment } from "@/lib/stocking";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/session";
import { revalidatePath } from "next/cache";

export async function importSourcingAction(formData: FormData) {
  const user = await requireRole(["OWNER", "MANAGER"]);
  const file = formData.get("file");
  if (!(file instanceof File)) return;
  const adapter = getSourceAdapter();
  const rows = adapter.parse(await file.text());
  if (rows.length) {
    await prisma.sourcingCandidate.createMany({
      data: rows.map((row) => ({
        organizationId: user.organizationId,
        vin: row.vin,
        year: row.year,
        make: row.make,
        model: row.model,
        trim: row.trim,
        segment: row.segment ?? classifySegment(undefined, row.model),
        mileage: row.mileage,
        askingCents: row.askingCents,
        sourceName: row.sourceName,
        adapter: adapter.id,
      })),
    });
  }
  revalidatePath("/app/sourcing");
}

export async function stockSourcingCandidateAction(formData: FormData) {
  const user = await requireRole(["OWNER", "MANAGER"]);
  const id = String(formData.get("id") ?? "");
  const rooftopId = String(formData.get("rooftopId") ?? "");
  const candidate = await prisma.sourcingCandidate.findFirst({
    where: { id, organizationId: user.organizationId },
  });
  if (!candidate) return;

  const exists = await prisma.vehicle.findFirst({
    where: { organizationId: user.organizationId, vin: candidate.vin },
  });
  if (exists) return;

  const count = await prisma.vehicle.count({ where: { organizationId: user.organizationId } });
  await prisma.vehicle.create({
    data: {
      organizationId: user.organizationId,
      rooftopId,
      vin: candidate.vin,
      stockNumber: `SRC${String(count + 1).padStart(4, "0")}`,
      year: candidate.year,
      make: candidate.make,
      model: candidate.model,
      trim: candidate.trim,
      segment: candidate.segment,
      mileage: candidate.mileage,
      costCents: candidate.askingCents,
      listPriceCents: candidate.askingCents,
      status: "IN_RECON",
      reconStage: "INTAKE",
      acquiredAt: new Date(),
      stageEnteredAt: new Date(),
      kind: "USED",
    },
  });
  await prisma.sourcingCandidate.delete({ where: { id } });
  revalidatePath("/app/sourcing");
  revalidatePath("/app/inventory");
}
