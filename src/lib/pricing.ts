export type PriceFlag = "over" | "under" | "in-market" | "no-market";

export type PriceAnalysis = {
  flag: PriceFlag;
  deltaCents: number | null;
  pct: number | null;
  suggestedListCents: number | null;
  aging: boolean;
  daysInStock: number;
};

export function daysInStock(acquiredAt: Date, now = new Date()): number {
  const ms = now.getTime() - acquiredAt.getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

export function analyzePrice(input: {
  listCents: number;
  marketRetailCents: number | null | undefined;
  acquiredAt: Date;
  agingThresholdDays?: number;
  now?: Date;
}): PriceAnalysis {
  const days = daysInStock(input.acquiredAt, input.now);
  const aging = days >= (input.agingThresholdDays ?? 45);
  const market = input.marketRetailCents ?? null;

  if (market == null || market <= 0) {
    return {
      flag: "no-market",
      deltaCents: null,
      pct: null,
      suggestedListCents: null,
      aging,
      daysInStock: days,
    };
  }

  const deltaCents = input.listCents - market;
  const pct = deltaCents / market;
  let flag: PriceFlag = "in-market";
  if (pct > 0.03) flag = "over";
  else if (pct < -0.03) flag = "under";

  let suggested = market;
  if (days > 30) {
    const weeksOver = Math.floor((days - 30) / 7);
    const haircut = Math.min(0.15, weeksOver * 0.01);
    suggested = Math.round(market * (1 - haircut));
  }

  return {
    flag,
    deltaCents,
    pct,
    suggestedListCents: suggested,
    aging,
    daysInStock: days,
  };
}

export function priceFlagLabel(flag: PriceFlag): string {
  switch (flag) {
    case "over":
      return "Over market";
    case "under":
      return "Under market";
    case "in-market":
      return "In market";
    case "no-market":
      return "No market value";
  }
}

export function suggestedOfferCents(input: {
  marketTradeInCents: number | null | undefined;
  marketWholesaleCents: number | null | undefined;
  reconEstimateCents?: number;
}): number | null {
  const wholesale = input.marketWholesaleCents ?? null;
  const trade = input.marketTradeInCents ?? null;
  const base = wholesale ?? trade;
  if (base == null) return null;
  return Math.max(0, base - (input.reconEstimateCents ?? 0));
}
