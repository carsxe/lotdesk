import { describe, expect, it } from "vitest";
import { demandFromMarket, scoreOwnedVehicle, scoreUnit } from "./turn-score";

describe("turn score", () => {
  it("holds a fresh unit with healthy retail gross", () => {
    const result = scoreUnit({
      marketRetailCents: 25000_00,
      marketWholesaleCents: 20500_00,
      costCents: 19800_00,
      daysInStock: 8,
      holdingCostPerDayCents: 3500,
      reconSpendCents: 400_00,
      listPriceCents: 24900_00,
      targetTurnDays: 45,
      owned: true,
    });
    expect(result.recommendation).toBe("RETAIL_HOLD");
    expect(result.score).toBeGreaterThanOrEqual(60);
    expect(result.expectedGrossCents).toBeGreaterThan(0);
  });

  it("prices down an over-ask aging unit", () => {
    const result = scoreUnit({
      marketRetailCents: 24000_00,
      marketWholesaleCents: 19800_00,
      costCents: 19100_00,
      daysInStock: 36,
      holdingCostPerDayCents: 3500,
      reconSpendCents: 200_00,
      listPriceCents: 26800_00,
      targetTurnDays: 45,
    });
    expect(result.recommendation).toBe("PRICE_DOWN");
    expect(result.suggestedListCents).toBeLessThan(24000_00);
  });

  it("flags a 60+ day loser for wholesale now", () => {
    const result = scoreOwnedVehicle({
      marketRetailCents: 21900_00,
      marketWholesaleCents: 16800_00,
      costCents: 18800_00,
      listPriceCents: 21900_00,
      acquiredAt: new Date("2026-08-20T00:00:00.000Z"),
      holdingCostPerDayCents: 3500,
      reconSpendCents: 900_00,
      targetTurnDays: 45,
      now: new Date("2026-10-30T00:00:00.000Z"),
    });
    expect(result.holdingCostCents / 3500).toBeGreaterThan(60);
    expect(result.recommendation).toBe("WHOLESALE_NOW");
    expect(result.score).toBeLessThan(45);
  });

  it("tells the desk not to buy negative-gross appraisals", () => {
    const result = scoreUnit({
      marketRetailCents: 9800_00,
      marketWholesaleCents: 6200_00,
      costCents: 7800_00,
      daysInStock: 0,
      holdingCostPerDayCents: 3500,
      reconSpendCents: 2400_00,
      owned: false,
    });
    expect(result.recommendation).toBe("DONT_BUY");
  });

  it("derives demand from the CarsXE retail-wholesale spread", () => {
    const wide = demandFromMarket(30000_00, 22000_00);
    const tight = demandFromMarket(20000_00, 19500_00);
    expect(wide.demandIndex).toBeGreaterThan(tight.demandIndex);
    expect(wide.supplyIndex).toBeLessThan(tight.supplyIndex);
  });
});
