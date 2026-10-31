"use server";

import { applyReconDecision, reconSpendFromLines } from "@/lib/recon";
import { prisma } from "@/lib/prisma";
import { dollarsToCents } from "@/lib/money";
import { requireRole, requireUser } from "@/server/session";
import type { ReconStage } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function addReconLineAction(formData: FormData) {
  const user = await requireUser();
  const vehicleId = String(formData.get("vehicleId") ?? "");
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, organizationId: user.organizationId },
  });
  if (!vehicle) return;

  await prisma.reconLine.create({
    data: {
      organizationId: user.organizationId,
      vehicleId,
      title: String(formData.get("title") ?? "Recon item"),
      category: String(formData.get("category") ?? "Mechanical"),
      estimateCents: dollarsToCents(String(formData.get("estimate") ?? "0")),
      vendor: String(formData.get("vendor") ?? "") || null,
      stage: (String(formData.get("stage") ?? "MECHANICAL") as ReconStage) || "MECHANICAL",
      notes: String(formData.get("notes") ?? "") || null,
    },
  });
  revalidatePath("/app/recon");
  revalidatePath(`/app/inventory/${vehicleId}`);
}

export async function decideReconLineAction(formData: FormData) {
  const user = await requireRole(["OWNER", "MANAGER"]);
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "") as "APPROVED" | "DECLINED";
  const line = await prisma.reconLine.findFirst({
    where: { id, organizationId: user.organizationId },
  });
  if (!line) return;

  const applied = applyReconDecision({ status: line.status, role: user.role, decision });
  await prisma.reconLine.update({
    where: { id },
    data: { status: applied.status, decidedAt: applied.decidedAt, approvedById: user.id },
  });

  const lines = await prisma.reconLine.findMany({ where: { vehicleId: line.vehicleId } });
  await prisma.vehicle.update({
    where: { id: line.vehicleId },
    data: { reconSpendCents: reconSpendFromLines(lines) },
  });

  revalidatePath("/app/recon");
  revalidatePath("/app/turn-score");
}

export async function advanceReconStageAction(formData: FormData) {
  const user = await requireRole(["OWNER", "MANAGER"]);
  const id = String(formData.get("vehicleId") ?? "");
  const stage = String(formData.get("stage") ?? "READY") as ReconStage;
  await prisma.vehicle.updateMany({
    where: { id, organizationId: user.organizationId },
    data: {
      reconStage: stage,
      stageEnteredAt: new Date(),
      status: stage === "READY" ? "FRONTLINE" : "IN_RECON",
    },
  });
  revalidatePath("/app/recon");
  revalidatePath("/app/inventory");
}
