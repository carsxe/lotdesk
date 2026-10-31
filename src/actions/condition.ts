"use server";

import { getInspectionProvider } from "@/lib/adapters/inspection";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/session";
import type { InspectionSeverity } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function createInspectionAction(formData: FormData) {
  const user = await requireUser();
  const appraisalId = String(formData.get("appraisalId") ?? "") || null;
  const vehicleId = String(formData.get("vehicleId") ?? "") || null;
  const imageUrl = String(formData.get("imageUrl") ?? "") || null;
  const notes = String(formData.get("notes") ?? "") || undefined;
  const provider = getInspectionProvider();
  const draft = await provider.analyze({ imageUrl: imageUrl ?? undefined, notes });

  await prisma.inspection.create({
    data: {
      organizationId: user.organizationId,
      appraisalId,
      vehicleId,
      grade: String(formData.get("grade") ?? draft.grade),
      provider: draft.provider,
      imageUrl:
        imageUrl ??
        `/api/demo-image?year=2018&make=Inspection&model=Exterior&angle=front`,
      notes,
    },
  });
  revalidatePath("/app/condition");
  if (appraisalId) revalidatePath(`/app/appraisals/${appraisalId}`);
}

export async function addInspectionTagAction(formData: FormData) {
  const user = await requireUser();
  const inspectionId = String(formData.get("inspectionId") ?? "");
  const inspection = await prisma.inspection.findFirst({
    where: { id: inspectionId, organizationId: user.organizationId },
  });
  if (!inspection) return;
  await prisma.inspectionTag.create({
    data: {
      inspectionId,
      x: Number(formData.get("x") ?? 0.5),
      y: Number(formData.get("y") ?? 0.5),
      label: String(formData.get("label") ?? "Note"),
      severity: (String(formData.get("severity") ?? "MINOR") as InspectionSeverity) || "MINOR",
      notes: String(formData.get("notes") ?? "") || null,
    },
  });
  revalidatePath("/app/condition");
}
