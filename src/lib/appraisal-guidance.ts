import { scoreUnit, type TurnScore } from "@/lib/turn-score";

export type AppraisalGuidance = {
  offerLowCents: number | null;
  offerHighCents: number | null;
  offerCents: number | null;
  walkAwayCents: number | null;
  counterCents: number | null;
  turn: TurnScore;
};

export function guideAppraisal(input: {
  marketRetailCents: number | null | undefined;
  marketWholesaleCents: number | null | undefined;
  marketTradeInCents: number | null | undefined;
  reconEstimateCents?: number;
  holdingCostPerDayCents?: number;
  targetTurnDays?: number;
  daysOnLotAssumption?: number;
  titleBrands?: number;
  hasOpenLien?: boolean;
  hasTheftFlag?: boolean;
}): AppraisalGuidance {
  const recon = input.reconEstimateCents ?? 0;
  const wholesale = input.marketWholesaleCents ?? null;
  const trade = input.marketTradeInCents ?? null;
  const retail = input.marketRetailCents ?? null;
  const base = wholesale ?? trade;

  const offerHighCents = base == null ? null : Math.max(0, Math.round(base * 1.02) - recon);
  const offerLowCents = base == null ? null : Math.max(0, Math.round((wholesale ?? base) * 0.92) - recon);
  const offerCents =
    base == null ? null : Math.max(0, Math.round((wholesale ?? base) * 0.97) - recon);
  const walkAwayCents = base == null ? null : Math.max(0, Math.round((wholesale ?? base) * 1.06) - recon);
  const counterCents =
    offerCents == null || walkAwayCents == null
      ? null
      : Math.round((offerCents + Math.min(walkAwayCents, offerCents + (walkAwayCents - offerCents) * 0.45)) / 2);

  const assumedCost = offerCents ?? base ?? 0;
  const turn = scoreUnit({
    marketRetailCents: retail,
    marketWholesaleCents: wholesale,
    costCents: assumedCost,
    daysInStock: input.daysOnLotAssumption ?? 0,
    holdingCostPerDayCents: input.holdingCostPerDayCents ?? 3500,
    reconSpendCents: recon,
    targetTurnDays: input.targetTurnDays,
    owned: false,
    titleBrands: input.titleBrands,
    hasOpenLien: input.hasOpenLien,
    hasTheftFlag: input.hasTheftFlag,
  });

  return {
    offerLowCents,
    offerHighCents,
    offerCents,
    walkAwayCents,
    counterCents,
    turn,
  };
}
