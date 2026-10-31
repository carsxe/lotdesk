export type InventoryCsvRow = {
  vin: string;
  mileage?: number;
  cost?: number;
  listPrice?: number;
  stockNumber?: string;
  rooftop?: string;
  acquiredAt?: string;
};

export function parseInventoryCsv(text: string): InventoryCsvRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
  if (lines.length === 0) return [];

  const header = splitCsvLine(lines[0]).map((cell) => cell.trim().toLowerCase());
  const looksLikeHeader = header.includes("vin");
  const rows = looksLikeHeader ? lines.slice(1) : lines;
  const columns = looksLikeHeader
    ? header
    : ["vin", "mileage", "cost", "listprice", "stocknumber"];

  return rows.map((line) => {
    const cells = splitCsvLine(line);
    const get = (name: string) => {
      const index = columns.indexOf(name);
      return index >= 0 ? cells[index]?.trim() : undefined;
    };
    const vin = get("vin") ?? cells[0];
    return {
      vin,
      mileage: toNumber(get("mileage") ?? cells[1]),
      cost: toNumber(get("cost") ?? cells[2]),
      listPrice: toNumber(get("listprice") ?? get("list_price") ?? cells[3]),
      stockNumber: get("stocknumber") ?? get("stock") ?? get("stock_number"),
      rooftop: get("rooftop") ?? get("store"),
      acquiredAt: get("acquiredat") ?? get("acquired_at") ?? get("datein"),
    };
  });
}

function toNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number(value.replace(/[$,]/g, ""));
  return Number.isFinite(n) ? n : undefined;
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      out.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  out.push(current);
  return out;
}
