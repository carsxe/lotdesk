export type StockingAction = "BUY" | "AT_TARGET" | "OVERSTOCK";

export type StockingUnit = {
  id: string;
  make: string;
  model: string;
  segment: string | null;
  kind?: "USED" | "NEW";
  daysInStock: number;
  status: string;
};

export type StockingBin = {
  key: string;
  make: string;
  model: string;
  segment: string;
  count: number;
  target: number;
  need: number;
  action: StockingAction;
  agedCount: number;
  avgDays: number;
  unitIds: string[];
};

export function binKey(make: string, model: string, segment?: string | null): string {
  return `${make.trim().toLowerCase()}|${model.trim().toLowerCase()}|${(segment ?? "Other").trim().toLowerCase()}`;
}

export function classifySegment(bodyStyle?: string | null, model?: string | null): string {
  const hay = `${bodyStyle ?? ""} ${model ?? ""}`.toLowerCase();
  if (/pickup|truck|f-150|f150|silverado|sierra|ram 1500|tundra|tacoma/.test(hay)) return "Truck";
  if (/suv|crossover|cr-v|crv|rav4|suburban|tahoe|wrangler|cherokee|pilot|4runner|explorer/.test(hay)) {
    return "SUV";
  }
  if (/van|minivan|odyssey|sienna|carnival/.test(hay)) return "Van";
  if (/coupe|convertible|mustang|camaro|charger|challenger/.test(hay)) return "Sport";
  return "Car";
}

export function buildStockingBoard(
  units: StockingUnit[],
  targetUnitsPerModel = 2,
  agingThresholdDays = 45,
): StockingBin[] {
  const used = units.filter((unit) => (unit.kind ?? "USED") === "USED" && unit.status !== "SOLD");
  const groups = new Map<string, StockingUnit[]>();
  for (const unit of used) {
    const key = binKey(unit.make, unit.model, unit.segment ?? classifySegment(null, unit.model));
    const list = groups.get(key) ?? [];
    list.push(unit);
    groups.set(key, list);
  }

  return [...groups.entries()]
    .map(([key, list]) => {
      const sample = list[0];
      const count = list.length;
      const need = targetUnitsPerModel - count;
      const action: StockingAction = need > 0 ? "BUY" : need < 0 ? "OVERSTOCK" : "AT_TARGET";
      const agedCount = list.filter((unit) => unit.daysInStock >= agingThresholdDays).length;
      const avgDays = Math.round(list.reduce((sum, unit) => sum + unit.daysInStock, 0) / count);
      return {
        key,
        make: sample.make,
        model: sample.model,
        segment: sample.segment ?? classifySegment(null, sample.model),
        count,
        target: targetUnitsPerModel,
        need,
        action,
        agedCount,
        avgDays,
        unitIds: list.map((unit) => unit.id),
      };
    })
    .sort((a, b) => a.need - b.need || b.count - a.count);
}

export function stockingActionLabel(action: StockingAction): string {
  switch (action) {
    case "BUY":
      return "Buy more";
    case "AT_TARGET":
      return "At target";
    case "OVERSTOCK":
      return "Overstocked";
  }
}
