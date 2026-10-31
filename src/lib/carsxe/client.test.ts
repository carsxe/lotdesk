import { describe, expect, it, vi } from "vitest";
import { CarsxeClient, CarsxeError } from "./client";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("CarsxeClient", () => {
  it("calls /specs with the public query shape", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({
        success: true,
        input: { vin: "WBAFR7C57CC811956" },
        attributes: { year: "2012", make: "BMW", model: "5-Series", trim: "535i" },
      }),
    );
    const client = new CarsxeClient({
      apiKey: "test-key",
      baseUrl: "https://api.carsxe.com",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    const result = await client.specs("WBAFR7C57CC811956");
    expect(result.attributes?.make).toBe("BMW");
    const url = String(fetchImpl.mock.calls[0][0]);
    expect(url).toContain("https://api.carsxe.com/specs");
    expect(url).toContain("key=test-key");
    expect(url).toContain("vin=WBAFR7C57CC811956");
  });

  it("calls market value v2 and plate decoder paths", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ retail_clean: { adjusted_retail_clean: 8600 } }))
      .mockResolvedValueOnce(jsonResponse({ success: true, vin: "1GNSCGKC0JR318026" }));
    const client = new CarsxeClient({
      apiKey: "test-key",
      baseUrl: "https://api.carsxe.com",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    await client.marketValue({
      vin: "3KPFK4A78HE103497",
      state: "CA",
      mileage: 50000,
      condition: "clean",
    });
    await client.usPlateDecoder({ plate: "H37SFS", state: "NJ" });
    expect(String(fetchImpl.mock.calls[0][0])).toContain("/v2/marketvalue");
    expect(String(fetchImpl.mock.calls[1][0])).toContain("/us-plate-decoder");
  });

  it("throws CarsxeError on 401", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ message: "Missing API key" }, 401));
    const client = new CarsxeClient({
      apiKey: "bad",
      baseUrl: "https://api.carsxe.com",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    await expect(client.recalls("WBAFR7C57CC811956")).rejects.toBeInstanceOf(CarsxeError);
  });
});
