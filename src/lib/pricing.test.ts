import { describe, expect, it } from "vitest";
import { analyzePrice, daysInStock, suggestedOfferCents } from "./pricing";

describe("pricing", () => {
  const acquired = new Date("2026-09-01T00:00:00.000Z");
  const now = new Date("2026-10-30T00:00:00.000Z");

  it("counts days in stock", () => {
    expect(daysInStock(acquired, now)).toBe(59);
  });

  it("flags over-market and aging units", () => {
    const result = analyzePrice({
      listCents: 28000_00,
      marketRetailCents: 24000_00,
      acquiredAt: acquired,
      agingThresholdDays: 45,
      now,
    });
    expect(result.flag).toBe("over");
    expect(result.aging).toBe(true);
    expect(result.suggestedListCents).toBeLessThan(24000_00);
  });

  it("keeps in-market prices near retail", () => {
    const result = analyzePrice({
      listCents: 24200_00,
      marketRetailCents: 24000_00,
      acquiredAt: new Date("2026-10-20T00:00:00.000Z"),
      now,
    });
    expect(result.flag).toBe("in-market");
    expect(result.suggestedListCents).toBe(24000_00);
  });

  it("suggests a wholesale-based offer", () => {
    expect(
      suggestedOfferCents({
        marketWholesaleCents: 14000_00,
        marketTradeInCents: 12000_00,
        reconEstimateCents: 800_00,
      }),
    ).toBe(13200_00);
  });
});
