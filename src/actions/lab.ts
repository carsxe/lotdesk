"use server";

import { prisma } from "@/lib/prisma";
import { requireRole, requireUser } from "@/server/session";
import { revalidatePath } from "next/cache";

export async function toggleFlagAction(formData: FormData) {
  const user = await requireRole(["OWNER", "MANAGER"]);
  const key = String(formData.get("key") ?? "");
  const enabled = String(formData.get("enabled") ?? "false") === "true";
  await prisma.featureFlag.upsert({
    where: { organizationId_key: { organizationId: user.organizationId, key } },
    update: { enabled },
    create: { organizationId: user.organizationId, key, enabled },
  });
  revalidatePath("/app/lab");
}

export async function submitBetaFeedbackAction(formData: FormData) {
  const user = await requireUser();
  await prisma.betaFeedback.create({
    data: {
      organizationId: user.organizationId,
      userId: user.id,
      flagKey: String(formData.get("flagKey") ?? ""),
      rating: Number(formData.get("rating") ?? 3),
      comment: String(formData.get("comment") ?? "") || null,
    },
  });
  revalidatePath("/app/lab");
}
