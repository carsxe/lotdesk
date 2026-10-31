import { describe, expect, it } from "vitest";
import { cacheKeyFor, decryptSecret, encryptSecret } from "./crypto";

describe("crypto", () => {
  it("round-trips secrets with AES-256-GCM", () => {
    const secret = "0".repeat(64);
    const cipher = encryptSecret("carsxe-test-key", secret);
    expect(cipher).not.toContain("carsxe-test-key");
    expect(decryptSecret(cipher, secret)).toBe("carsxe-test-key");
  });

  it("builds a stable cache key", () => {
    const a = cacheKeyFor({ vin: "WBAFR7C57CC811956", mileage: 1000 });
    const b = cacheKeyFor({ mileage: 1000, vin: "wbafr7c57cc811956" });
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });
});
