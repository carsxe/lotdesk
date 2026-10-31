import { describe, expect, it } from "vitest";
import { parseInventoryCsv } from "./csv";

describe("parseInventoryCsv", () => {
  it("parses a headered file", () => {
    const rows = parseInventoryCsv(
      "vin,mileage,cost,listPrice,stockNumber\nWBAFR7C57CC811956,12000,6200,9800,W-1\n",
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].vin).toBe("WBAFR7C57CC811956");
    expect(rows[0].cost).toBe(6200);
    expect(rows[0].stockNumber).toBe("W-1");
  });

  it("handles quoted commas", () => {
    const rows = parseInventoryCsv('vin,notes\nABC,"hello, world"');
    expect(rows[0].vin).toBe("ABC");
  });
});
