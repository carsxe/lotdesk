import { describe, expect, it } from "vitest";
import { cacheKeyFor, decryptSecret, encryptSecret } from "./crypto";

describe("crypto", () => {
  it("round-trips secrets with AES-256-GCM", () => {
    const secret = "0".repeat(64);
    const cipher = encryptSecret("carsxe-test-key", secret);
    expect(cipher).not.toContain("carsxe-test-key");
    expect(decryptSecret(cipher, secret)).toBe("carsxe-test-key");
  });

  it("derives a 32-byte AES key from a Render generateValue-style secret", () => {
    const generated = Buffer.alloc(32, 7).toString("base64");
    expect(generated).not.toMatch(/^[0-9a-fA-F]{64}$/);
    const cipher = encryptSecret("carsxe-test-key", generated);
    expect(decryptSecret(cipher, generated)).toBe("carsxe-test-key");
  });

  it("builds a stable cache key", () => {
    const a = cacheKeyFor({ vin: "WBAFR7C57CC811956", mileage: 1000 });
    const b = cacheKeyFor({ mileage: 1000, vin: "wbafr7c57cc811956" });
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });
});
