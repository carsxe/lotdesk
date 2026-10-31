import { describe, expect, it } from "vitest";
import { applyReconDecision, canDecideRecon, holdingCostCents, reconSpendFromLines } from "./recon";

describe("recon approvals", () => {
  it("lets owners and managers decide pending lines", () => {
    expect(canDecideRecon("OWNER")).toBe(true);
    expect(canDecideRecon("APPRAISER")).toBe(false);
    const approved = applyReconDecision({
      status: "PENDING",
      role: "MANAGER",
      decision: "APPROVED",
      now: new Date("2026-10-30T00:00:00.000Z"),
    });
    expect(approved.status).toBe("APPROVED");
    expect(approved.decidedAt.toISOString()).toBe("2026-10-30T00:00:00.000Z");
  });

  it("blocks appraisers and already-decided lines", () => {
    expect(() =>
      applyReconDecision({ status: "PENDING", role: "APPRAISER", decision: "APPROVED" }),
    ).toThrow(/cannot approve/);
    expect(() =>
      applyReconDecision({ status: "APPROVED", role: "OWNER", decision: "DECLINED" }),
    ).toThrow(/pending/);
  });

  it("rolls approved estimates into recon spend and holding cost", () => {
    const spend = reconSpendFromLines([
      { status: "APPROVED", estimateCents: 400_00 },
      { status: "PENDING", estimateCents: 900_00 },
      { status: "DECLINED", estimateCents: 200_00 },
    ]);
    expect(spend).toBe(400_00);
    expect(holdingCostCents({ daysInStock: 10, holdingCostPerDayCents: 3500, reconSpendCents: spend })).toBe(
      350_00 + 400_00,
    );
  });
});
