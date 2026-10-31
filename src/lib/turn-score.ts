import { daysInStock } from "@/lib/pricing";

export type TurnRecommendation =
  | "RETAIL_HOLD"
  | "PRICE_DOWN"
  | "WHOLESALE_SOON"
  | "WHOLESALE_NOW"
  | "DONT_BUY";

export type TurnScoreInput = {
  marketRetailCents: number | null | undefined;
  marketWholesaleCents: number | null | undefined;
  costCents: number;
  daysInStock: number;
  holdingCostPerDayCents: number;
  reconSpendCents: number;
  listPriceCents?: number | null;
  targetTurnDays?: number;
  demandIndex?: number;
  supplyIndex?: number;
  owned?: boolean;
  titleBrands?: number;
  hasOpenLien?: boolean;
  hasTheftFlag?: boolean;
};

export type TurnScore = {
  score: number;
  recommendation: TurnRecommendation;
  label: string;
  rationale: string[];
  expectedGrossCents: number | null;
  holdingCostCents: number;
  allInCostCents: number;
  suggestedListCents: number | null;
  spreadCents: number | null;
};

export function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

export function demandFromMarket(
  retailCents: number | null | undefined,
  wholesaleCents: number | null | undefined,
): { demandIndex: number; supplyIndex: number } {
  if (!retailCents || !wholesaleCents || retailCents <= 0) {
    return { demandIndex: 50, supplyIndex: 50 };
  }
  const spread = (retailCents - wholesaleCents) / retailCents;
  const demandIndex = clamp(Math.round(35 + spread * 220));
  return { demandIndex, supplyIndex: 100 - demandIndex };
}

export function scoreUnit(input: TurnScoreInput): TurnScore {
  const target = input.targetTurnDays ?? 45;
  const holdingCostCents = input.daysInStock * input.holdingCostPerDayCents;
  const allInCostCents = input.costCents + input.reconSpendCents + holdingCostCents;
  const retail = input.marketRetailCents && input.marketRetailCents > 0 ? input.marketRetailCents : null;
  const wholesale =
    input.marketWholesaleCents && input.marketWholesaleCents > 0 ? input.marketWholesaleCents : null;
  const spreadCents = retail != null && wholesale != null ? retail - wholesale : null;
  const expectedGrossCents = retail != null ? retail - allInCostCents : null;

  const { demandIndex, supplyIndex } = {
    demandIndex: input.demandIndex ?? demandFromMarket(retail, wholesale).demandIndex,
    supplyIndex: input.supplyIndex ?? demandFromMarket(retail, wholesale).supplyIndex,
  };

  let score = 52;
  const rationale: string[] = [];

  if (expectedGrossCents != null && retail) {
    const margin = expectedGrossCents / retail;
    if (margin >= 0.15) {
      score += 24;
      rationale.push("Healthy retail gross after cost, recon, and hold.");
    } else if (margin >= 0.08) {
      score += 14;
      rationale.push("Workable retail gross after all-in cost.");
    } else if (margin >= 0.03) {
      score += 4;
      rationale.push("Thin but positive retail gross.");
    } else if (margin >= 0) {
      score -= 10;
      rationale.push("Gross is nearly gone after holding and recon.");
    } else {
      score -= 26;
      rationale.push("All-in cost is above CarsXE retail clean.");
    }
  } else {
    score -= 8;
    rationale.push("No CarsXE retail value on file — score is conservative.");
  }

  const owned = input.owned ?? true;
  const dayRatio = target > 0 ? input.daysInStock / target : 1;
  if (owned) {
    if (dayRatio <= 0.4) {
      score += 10;
      rationale.push("Fresh unit — well inside the target turn.");
    } else if (dayRatio <= 0.8) {
      score += 4;
    } else if (dayRatio <= 1) {
      score -= 6;
      rationale.push("Approaching the rooftop turn target.");
    } else if (dayRatio <= 1.35) {
      score -= 16;
      rationale.push("Past the target turn. Holding cost is compounding.");
    } else {
      score -= 28;
      rationale.push("Well past the target turn. Retail odds are fading.");
    }
  }

  if ((input.titleBrands ?? 0) > 0) {
    score -= input.titleBrands! * 12;
    rationale.push(`${input.titleBrands} title brand${input.titleBrands === 1 ? "" : "s"} on the CarsXE history.`);
  }
  if (input.hasOpenLien) {
    score -= 14;
    rationale.push("Open lien on file.");
  }
  if (input.hasTheftFlag) {
    score -= 18;
    rationale.push("Theft flag on file.");
  }

  if (retail && holdingCostCents / retail > 0.08) {
    score -= 10;
    rationale.push("Accumulated hold is a large share of retail.");
  }

  const risky = (input.titleBrands ?? 0) > 0 || input.hasOpenLien || input.hasTheftFlag;
  const pressure = clamp((demandIndex - supplyIndex) / 4, -12, 12);
  if (!risky) {
    score += pressure;
    if (demandIndex - supplyIndex >= 16) {
      rationale.push("CarsXE retail-to-wholesale spread signals demand.");
    } else if (supplyIndex - demandIndex >= 16) {
      rationale.push("Tight spread — market looks well supplied.");
    }
  }

  if (input.listPriceCents && retail && input.listPriceCents > retail * 1.03 && input.daysInStock >= 21) {
    score -= 8;
    rationale.push("Asking price is over CarsXE retail on an aging unit.");
  }

  score = clamp(Math.round(score));

  let recommendation: TurnRecommendation;
  if (!owned && (score < 42 || (expectedGrossCents != null && expectedGrossCents < 0))) {
    recommendation = "DONT_BUY";
  } else if (owned && (dayRatio >= 1.4 || (score < 34 && dayRatio >= 1))) {
    recommendation = "WHOLESALE_NOW";
  } else if (dayRatio >= 1 || score < 42) {
    recommendation = "WHOLESALE_SOON";
  } else if (
    (input.listPriceCents != null && retail != null && input.listPriceCents > retail * 1.03) ||
    (input.daysInStock >= 30 && score < 62)
  ) {
    recommendation = "PRICE_DOWN";
  } else {
    recommendation = "RETAIL_HOLD";
  }

  let suggestedListCents: number | null = retail;
  if (retail) {
    if (recommendation === "PRICE_DOWN" || recommendation === "WHOLESALE_SOON") {
      const weeksOver = Math.max(0, Math.floor((input.daysInStock - 21) / 7));
      suggestedListCents = Math.round(retail * (1 - Math.min(0.12, weeksOver * 0.015)));
    } else if (recommendation === "WHOLESALE_NOW") {
      suggestedListCents = wholesale ?? Math.round(retail * 0.86);
    }
  }

  return {
    score,
    recommendation,
    label: recommendationLabel(recommendation),
    rationale,
    expectedGrossCents,
    holdingCostCents,
    allInCostCents,
    suggestedListCents,
    spreadCents,
  };
}

export function scoreOwnedVehicle(input: {
  marketRetailCents: number | null | undefined;
  marketWholesaleCents: number | null | undefined;
  costCents: number;
  listPriceCents: number;
  acquiredAt: Date;
  holdingCostPerDayCents: number;
  reconSpendCents: number;
  targetTurnDays?: number;
  now?: Date;
}): TurnScore {
  return scoreUnit({
    ...input,
    daysInStock: daysInStock(input.acquiredAt, input.now),
    owned: true,
  });
}

export function recommendationLabel(recommendation: TurnRecommendation): string {
  switch (recommendation) {
    case "RETAIL_HOLD":
      return "Retail — hold";
    case "PRICE_DOWN":
      return "Price down";
    case "WHOLESALE_SOON":
      return "Wholesale soon";
    case "WHOLESALE_NOW":
      return "Wholesale now";
    case "DONT_BUY":
      return "Do not buy";
  }
}
