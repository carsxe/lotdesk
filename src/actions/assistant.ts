"use server";

import { getAiProvider, type AssistantContext } from "@/lib/adapters/ai";
import { daysInStock } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";
import { scoreOwnedVehicle } from "@/lib/turn-score";
import { requireRole, requireUser } from "@/server/session";
import { revalidatePath } from "next/cache";

export type AssistantResult = {
  reply: string;
  items: { id: string; label: string; detail: string }[];
};

export async function runAssistantAction(
  _prev: AssistantResult | null,
  formData: FormData,
): Promise<AssistantResult> {
  const user = await requireUser();
  const prompt = String(formData.get("prompt") ?? "").trim();
  const vehicles = await prisma.vehicle.findMany({
    where: { organizationId: user.organizationId, status: { not: "SOLD" } },
    include: { rooftop: true, reconLines: true, photos: true },
  });
  const context: AssistantContext = {
    agedCount: vehicles.filter((v) => daysInStock(v.acquiredAt) >= 45).length,
    needPhotos: vehicles.filter((v) => !v.photoPackReady).length,
    pendingRecon: vehicles.reduce((sum, v) => sum + v.reconLines.filter((l) => l.status === "PENDING").length, 0),
    overMarket: vehicles.filter((v) => v.marketRetailCents && v.listPriceCents > v.marketRetailCents * 1.03).length,
  };
  const plan = await getAiProvider().planAssistant(prompt || "how is the lot", context);

  if (plan.action.type === "reprice_aged") {
    await requireRole(["OWNER", "MANAGER"]);
    const minDays = plan.action.minDays;
    const items = [];
    for (const vehicle of vehicles) {
      const days = daysInStock(vehicle.acquiredAt);
      if (days < minDays) continue;
      const turn = scoreOwnedVehicle({
        marketRetailCents: vehicle.marketRetailCents,
        marketWholesaleCents: vehicle.marketWholesaleCents,
        costCents: vehicle.costCents,
        listPriceCents: vehicle.listPriceCents,
        acquiredAt: vehicle.acquiredAt,
        holdingCostPerDayCents: vehicle.holdingCostPerDayCents || vehicle.rooftop.holdingCostPerDayCents,
        reconSpendCents: vehicle.reconSpendCents,
        targetTurnDays: vehicle.rooftop.targetTurnDays,
      });
      if (turn.suggestedListCents) {
        await prisma.vehicle.update({
          where: { id: vehicle.id },
          data: { listPriceCents: turn.suggestedListCents },
        });
        items.push({
          id: vehicle.id,
          label: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
          detail: `Repriced to $${(turn.suggestedListCents / 100).toFixed(0)}`,
        });
      }
    }
    revalidatePath("/app/pricing");
    revalidatePath("/app/assistant");
    return { reply: plan.reply, items };
  }

  if (plan.action.type === "wholesale_aged") {
    await requireRole(["OWNER", "MANAGER"]);
    const minDays = plan.action.minDays;
    const items = [];
    for (const vehicle of vehicles) {
      if (daysInStock(vehicle.acquiredAt) < minDays) continue;
      const turn = scoreOwnedVehicle({
        marketRetailCents: vehicle.marketRetailCents,
        marketWholesaleCents: vehicle.marketWholesaleCents,
        costCents: vehicle.costCents,
        listPriceCents: vehicle.listPriceCents,
        acquiredAt: vehicle.acquiredAt,
        holdingCostPerDayCents: vehicle.holdingCostPerDayCents || vehicle.rooftop.holdingCostPerDayCents,
        reconSpendCents: vehicle.reconSpendCents,
        targetTurnDays: vehicle.rooftop.targetTurnDays,
      });
      if (turn.recommendation === "WHOLESALE_NOW" || turn.recommendation === "WHOLESALE_SOON") {
        await prisma.vehicle.update({ where: { id: vehicle.id }, data: { status: "WHOLESALE" } });
        items.push({
          id: vehicle.id,
          label: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
          detail: turn.label,
        });
      }
    }
    revalidatePath("/app/inventory");
    return { reply: plan.reply, items };
  }

  if (plan.action.type === "list_need_photos") {
    return {
      reply: plan.reply,
      items: vehicles
        .filter((v) => !v.photoPackReady)
        .map((v) => ({
          id: v.id,
          label: `${v.year} ${v.make} ${v.model}`,
          detail: v.stockNumber,
        })),
    };
  }

  if (plan.action.type === "list_pending_recon") {
    return {
      reply: plan.reply,
      items: vehicles.flatMap((v) =>
        v.reconLines
          .filter((line) => line.status === "PENDING")
          .map((line) => ({
            id: line.id,
            label: `${v.year} ${v.make} ${v.model}`,
            detail: `${line.title} · $${(line.estimateCents / 100).toFixed(0)}`,
          })),
      ),
    };
  }

  return {
    reply: plan.reply,
    items: vehicles.slice(0, 6).map((v) => ({
      id: v.id,
      label: `${v.year} ${v.make} ${v.model}`,
      detail: `${daysInStock(v.acquiredAt)} days · ${v.status}`,
    })),
  };
}
