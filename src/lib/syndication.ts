export type FeedListing = {
  vin: string;
  stockNumber: string;
  year: number;
  make: string;
  model: string;
  trim?: string | null;
  mileage: number;
  listPriceCents: number;
  color?: string | null;
  description?: string | null;
  certified?: boolean;
  photoUrls?: string[];
};

export type FeedFormat = "json" | "csv" | "xml";

export type SyndicationAdapter = {
  id: string;
  name: string;
  formats: FeedFormat[];
  serialize(listings: FeedListing[], format: FeedFormat): string;
};

function xmlEscape(value: string): string {
  return value.replace(/[<>&'"]/g, (char) => {
    switch (char) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      default:
        return "&quot;";
    }
  });
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function serializeJsonFeed(listings: FeedListing[]): string {
  return JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      count: listings.length,
      vehicles: listings.map((item) => ({
        vin: item.vin,
        stockNumber: item.stockNumber,
        year: item.year,
        make: item.make,
        model: item.model,
        trim: item.trim ?? null,
        mileage: item.mileage,
        price: item.listPriceCents / 100,
        color: item.color ?? null,
        description: item.description ?? null,
        certified: Boolean(item.certified),
        photos: item.photoUrls ?? [],
      })),
    },
    null,
    2,
  );
}

export function serializeCsvFeed(listings: FeedListing[]): string {
  const header = ["vin", "stockNumber", "year", "make", "model", "trim", "mileage", "price", "color", "certified"];
  const rows = listings.map((item) =>
    [
      item.vin,
      item.stockNumber,
      String(item.year),
      item.make,
      item.model,
      item.trim ?? "",
      String(item.mileage),
      (item.listPriceCents / 100).toFixed(2),
      item.color ?? "",
      item.certified ? "true" : "false",
    ].map(csvEscape).join(","),
  );
  return [header.join(","), ...rows].join("\n");
}

export function serializeXmlFeed(listings: FeedListing[]): string {
  const body = listings
    .map(
      (item) => `  <vehicle>
    <vin>${xmlEscape(item.vin)}</vin>
    <stockNumber>${xmlEscape(item.stockNumber)}</stockNumber>
    <year>${item.year}</year>
    <make>${xmlEscape(item.make)}</make>
    <model>${xmlEscape(item.model)}</model>
    <trim>${xmlEscape(item.trim ?? "")}</trim>
    <mileage>${item.mileage}</mileage>
    <price>${(item.listPriceCents / 100).toFixed(2)}</price>
    <certified>${item.certified ? "true" : "false"}</certified>
  </vehicle>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<inventory count="${listings.length}">\n${body}\n</inventory>\n`;
}

export const lotdeskFeedAdapter: SyndicationAdapter = {
  id: "lotdesk-feed",
  name: "Lotdesk listing feed",
  formats: ["json", "csv", "xml"],
  serialize(listings, format) {
    if (format === "csv") return serializeCsvFeed(listings);
    if (format === "xml") return serializeXmlFeed(listings);
    return serializeJsonFeed(listings);
  },
};

export function getSyndicationAdapter(id = "lotdesk-feed"): SyndicationAdapter {
  if (id === "lotdesk-feed") return lotdeskFeedAdapter;
  return {
    id,
    name: `Custom syndication (${id})`,
    formats: ["json", "csv", "xml"],
    serialize(listings, format) {
      return lotdeskFeedAdapter.serialize(listings, format);
    },
  };
}

export function contentTypeFor(format: FeedFormat): string {
  switch (format) {
    case "csv":
      return "text/csv; charset=utf-8";
    case "xml":
      return "application/xml; charset=utf-8";
    default:
      return "application/json; charset=utf-8";
  }
}
