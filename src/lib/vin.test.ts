import { describe, expect, it } from "vitest";
import { isValidVin, normalizeVin } from "./vin";

describe("vin", () => {
  it("normalizes spacing and case", () => {
    expect(normalizeVin(" wbafr7c57cc811956 ")).toBe("WBAFR7C57CC811956");
  });

  it("accepts a documented CarsXE sample VIN", () => {
    expect(isValidVin("WBAFR7C57CC811956")).toBe(true);
  });

  it("rejects short or illegal characters", () => {
    expect(isValidVin("SHORT")).toBe(false);
    expect(isValidVin("WBAFR7C57CC81195I")).toBe(false);
  });
});
