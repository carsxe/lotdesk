export type IncentiveDraft = {
  name: string;
  make: string;
  model?: string;
  year?: number;
  amountCents: number;
  kind: "REBATE" | "BONUS" | "APR";
  source: string;
  startsAt?: string;
  endsAt?: string;
};

export type IncentiveAdapter = {
  id: string;
  name: string;
  pull(): Promise<IncentiveDraft[]>;
};

export const manualIncentiveAdapter: IncentiveAdapter = {
  id: "manual",
  name: "Dealer-entered programs",
  async pull() {
    return [];
  },
};

export function parseIncentiveCsv(text: string): IncentiveDraft[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];
  const header = lines[0].split(",").map((cell) => cell.trim().toLowerCase());
  const index = (name: string) => header.indexOf(name);
  return lines.slice(1).flatMap((line) => {
    const cells = line.split(",").map((cell) => cell.trim());
    const name = cells[index("name")] ?? "";
    const make = cells[index("make")] ?? "";
    if (!name || !make) return [];
    const amount = Number(String(cells[index("amount")] ?? "0").replace(/[$,]/g, ""));
    const kindRaw = (cells[index("kind")] ?? "REBATE").toUpperCase();
    const kind = kindRaw === "BONUS" || kindRaw === "APR" ? kindRaw : "REBATE";
    return [
      {
        name,
        make,
        model: cells[index("model")] || undefined,
        year: cells[index("year")] ? Number(cells[index("year")]) : undefined,
        amountCents: Math.round(amount * 100),
        kind: kind as IncentiveDraft["kind"],
        source: "IMPORT",
      },
    ];
  });
}

export function getIncentiveAdapter(id = process.env.INCENTIVE_ADAPTER ?? "manual"): IncentiveAdapter {
  if (id === "http" && process.env.INCENTIVE_ADAPTER_URL) {
    const url = process.env.INCENTIVE_ADAPTER_URL;
    const key = process.env.INCENTIVE_ADAPTER_KEY;
    return {
      id: "http",
      name: "HTTP incentive feed",
      async pull() {
        const response = await fetch(url, {
          headers: key ? { Authorization: `Bearer ${key}` } : undefined,
        });
        if (!response.ok) throw new Error("Incentive adapter request failed.");
        const body = (await response.json()) as { programs?: IncentiveDraft[] };
        return body.programs ?? [];
      },
    };
  }
  return manualIncentiveAdapter;
}

export function matchIncentives(
  programs: IncentiveDraft[],
  unit: { make: string; model: string; year: number },
): IncentiveDraft[] {
  return programs.filter((program) => {
    if (program.make.toLowerCase() !== unit.make.toLowerCase()) return false;
    if (program.model && program.model.toLowerCase() !== unit.model.toLowerCase()) return false;
    if (program.year && program.year !== unit.year) return false;
    return true;
  });
}
