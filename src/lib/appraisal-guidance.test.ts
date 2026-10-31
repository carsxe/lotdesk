import { describe, expect, it } from "vitest";
import { guideAppraisal } from "./appraisal-guidance";

describe("appraisal guidance", () => {
  it("builds an offer range, walk-away, and counter from wholesale", () => {
    const guide = guideAppraisal({
      marketRetailCents: 26100_00,
      marketWholesaleCents: 22600_00,
      marketTradeInCents: 20900_00,
      reconEstimateCents: 600_00,
    });
    expect(guide.offerLowCents).toBeLessThan(guide.offerCents!);
    expect(guide.offerCents).toBeLessThan(guide.offerHighCents!);
    expect(guide.walkAwayCents).toBeGreaterThan(guide.offerHighCents!);
    expect(guide.counterCents).toBeGreaterThan(guide.offerCents!);
    expect(guide.turn.recommendation).not.toBe("WHOLESALE_NOW");
  });

  it("walks a branded high-recon unit", () => {
    const guide = guideAppraisal({
      marketRetailCents: 9800_00,
      marketWholesaleCents: 6200_00,
      marketTradeInCents: 5400_00,
      reconEstimateCents: 2800_00,
      titleBrands: 2,
      hasOpenLien: true,
    });
    expect(guide.offerCents).toBeLessThan(4000_00);
    expect(guide.turn.recommendation).toBe("DONT_BUY");
  });
});
