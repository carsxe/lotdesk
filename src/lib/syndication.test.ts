import { describe, expect, it } from "vitest";
import { getSyndicationAdapter, serializeCsvFeed, serializeXmlFeed } from "./syndication";

const listing = {
  vin: "4T1G11AK1NU012345",
  stockNumber: "H-2204",
  year: 2022,
  make: "Toyota",
  model: "Camry",
  trim: "SE",
  mileage: 18440,
  listPriceCents: 24900_00,
  color: "Celestial Silver",
  certified: true,
};

describe("listing feeds", () => {
  it("serializes json, csv, and xml from the default adapter", () => {
    const adapter = getSyndicationAdapter("lotdesk-feed");
    const json = JSON.parse(adapter.serialize([listing], "json"));
    expect(json.count).toBe(1);
    expect(json.vehicles[0].vin).toBe(listing.vin);
    expect(json.vehicles[0].price).toBe(24900);

    const csv = serializeCsvFeed([listing]);
    expect(csv.split("\n")[0]).toContain("vin");
    expect(csv).toContain("4T1G11AK1NU012345");

    const xml = serializeXmlFeed([listing]);
    expect(xml).toContain("<inventory count=\"1\">");
    expect(xml).toContain("<vin>4T1G11AK1NU012345</vin>");
  });

  it("escapes xml special characters", () => {
    const xml = serializeXmlFeed([{ ...listing, make: "A&B", model: "<GT>" }]);
    expect(xml).toContain("A&amp;B");
    expect(xml).toContain("&lt;GT&gt;");
  });
});
