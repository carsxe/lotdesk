"use server";

import { parseIncentiveCsv } from "@/lib/adapters/incentive";
import { dollarsToCents } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/session";
import type { IncentiveKind } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function createIncentiveAction(formData: FormData) {
  const user = await requireRole(["OWNER", "MANAGER"]);
  await prisma.incentiveProgram.create({
    data: {
      organizationId: user.organizationId,
      name: String(formData.get("name") ?? "Program"),
      make: String(formData.get("make") ?? ""),
      model: String(formData.get("model") ?? "") || null,
      year: formData.get("year") ? Number(formData.get("year")) : null,
      amountCents: dollarsToCents(String(formData.get("amount") ?? "0")),
      kind: (String(formData.get("kind") ?? "REBATE") as IncentiveKind) || "REBATE",
      source: "MANUAL",
    },
  });
  revalidatePath("/app/new-lot");
}

export async function importIncentivesAction(formData: FormData) {
  const user = await requireRole(["OWNER", "MANAGER"]);
  const file = formData.get("file");
  if (!(file instanceof File)) return;
  const programs = parseIncentiveCsv(await file.text());
  if (programs.length) {
    await prisma.incentiveProgram.createMany({
      data: programs.map((program) => ({
        organizationId: user.organizationId,
        name: program.name,
        make: program.make,
        model: program.model,
        year: program.year,
        amountCents: program.amountCents,
        kind: program.kind,
        source: program.source,
      })),
    });
  }
  revalidatePath("/app/new-lot");
}
