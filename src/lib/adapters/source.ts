import { classifySegment } from "@/lib/stocking";
import { scoreUnit, type TurnRecommendation, type TurnScore } from "@/lib/turn-score";

export type SourceRow = {
  vin: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  mileage: number;
  askingCents: number;
  sourceName: string;
  segment?: string;
};

export type SourceAdapter = {
  id: string;
  name: string;
  parse(payload: string): SourceRow[];
};

export function parseSourceCsv(text: string): SourceRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];
  const header = lines[0].split(",").map((cell) => cell.trim().toLowerCase().replace(/[^a-z]/g, ""));
  const index = (name: string) => header.indexOf(name);

  return lines.slice(1).flatMap((line) => {
    const cells = line.split(",").map((cell) => cell.trim());
    const vin = cells[index("vin")] ?? "";
    const year = Number(cells[index("year")] ?? 0);
    const make = cells[index("make")] ?? "";
    const model = cells[index("model")] ?? "";
    if (!vin || !make || !model) return [];
    const asking = Number(String(cells[index("asking")] ?? cells[index("price")] ?? "0").replace(/[$,]/g, ""));
    return [
      {
        vin: vin.toUpperCase(),
        year,
        make,
        model,
        trim: cells[index("trim")] || undefined,
        mileage: Number(cells[index("mileage")] ?? 0),
        askingCents: Math.round((Number.isFinite(asking) ? asking : 0) * 100),
        sourceName: cells[index("source")] || "CSV import",
        segment: classifySegment(undefined, model),
      },
    ];
  });
}

export const csvSourceAdapter: SourceAdapter = {
  id: "csv",
  name: "CSV / feed import",
  parse: parseSourceCsv,
};

export function getSourceAdapter(id = process.env.SOURCE_ADAPTER ?? "csv"): SourceAdapter {
  if (id === "csv") return csvSourceAdapter;
  return {
    id,
    name: `Custom source (${id})`,
    parse: parseSourceCsv,
  };
}

export function scoreSourcingCandidate(input: {
  askingCents: number;
  marketRetailCents: number | null | undefined;
  marketWholesaleCents: number | null | undefined;
  reconEstimateCents?: number;
  binNeed?: number;
}): { turn: TurnScore; fit: "strong" | "watch" | "pass"; recommendation: TurnRecommendation } {
  const turn = scoreUnit({
    marketRetailCents: input.marketRetailCents,
    marketWholesaleCents: input.marketWholesaleCents,
    costCents: input.askingCents,
    daysInStock: 0,
    holdingCostPerDayCents: 3500,
    reconSpendCents: input.reconEstimateCents ?? 0,
    owned: false,
  });
  let fit: "strong" | "watch" | "pass" = "watch";
  if (turn.recommendation === "DONT_BUY" || (input.binNeed != null && input.binNeed < 0 && turn.score < 55)) {
    fit = "pass";
  } else if (turn.score >= 58 && (input.binNeed == null || input.binNeed > 0)) {
    fit = "strong";
  }
  return { turn, fit, recommendation: turn.recommendation };
}
