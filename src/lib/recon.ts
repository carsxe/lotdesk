import type { ReconLineStatus, Role } from "@prisma/client";

export type ReconDecision = "APPROVED" | "DECLINED";

export function canDecideRecon(role: Role): boolean {
  return role === "OWNER" || role === "MANAGER";
}

export function applyReconDecision(input: {
  status: ReconLineStatus;
  role: Role;
  decision: ReconDecision;
  now?: Date;
}): { status: ReconDecision; decidedAt: Date } {
  if (!canDecideRecon(input.role)) {
    throw new Error("Appraisers can add recon lines but cannot approve or decline them.");
  }
  if (input.status !== "PENDING") {
    throw new Error("Only pending recon lines can be decided.");
  }
  return { status: input.decision, decidedAt: input.now ?? new Date() };
}

export function reconSpendFromLines(lines: { status: ReconLineStatus; estimateCents: number }[]): number {
  return lines.filter((line) => line.status === "APPROVED").reduce((sum, line) => sum + line.estimateCents, 0);
}

export function pendingReconCents(lines: { status: ReconLineStatus; estimateCents: number }[]): number {
  return lines.filter((line) => line.status === "PENDING").reduce((sum, line) => sum + line.estimateCents, 0);
}

export function hoursInStep(stageEnteredAt: Date | null | undefined, now = new Date()): number {
  if (!stageEnteredAt) return 0;
  return Math.max(0, Math.round((now.getTime() - stageEnteredAt.getTime()) / 3_600_000));
}

export function holdingCostCents(input: {
  daysInStock: number;
  holdingCostPerDayCents: number;
  reconSpendCents: number;
}): number {
  return input.daysInStock * input.holdingCostPerDayCents + input.reconSpendCents;
}
