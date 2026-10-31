import { CarsxeClient, CarsxeError } from "@/lib/carsxe/client";
import {
  defaultFixture,
  getFixtureVin,
  getPlateFixture,
  internationalFixture,
} from "@/lib/carsxe/fixtures";
import {
  adjustedBandValue,
  DEFAULT_CACHE_TTL_HOURS,
  extractRecalls,
  type CarsxeCondition,
  type CarsxeEndpoint,
  type HistoryResponse,
  type ImagesResponse,
  type InternationalVinResponse,
  type LienTheftResponse,
  type MarketValueResponse,
  type RecallsResponse,
  type SpecsResponse,
  type UsPlateDecoderResponse,
} from "@/lib/carsxe/types";
import { cacheKeyFor, decryptSecret } from "@/lib/crypto";
import { getCarsxeApiBaseUrl, getEncryptionKey } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import type { Organization } from "@prisma/client";

export type CallMeta = {
  endpoint: CarsxeEndpoint;
  billed: boolean;
  cacheHit: boolean;
  demo: boolean;
};

export type CallResult<T> = {
  data: T;
  meta: CallMeta;
};

export type DeskLookup = {
  vin: string;
  plate?: string;
  plateState?: string;
  specs: SpecsResponse;
  marketValue: MarketValueResponse;
  history: HistoryResponse;
  recalls: RecallsResponse;
  lienTheft: LienTheftResponse | null;
  images: ImagesResponse;
  summary: DeskSummary;
  usage: CallMeta[];
};

export type DeskSummary = {
  year?: string;
  make?: string;
  model?: string;
  trim?: string;
  bodyStyle?: string;
  color?: string;
  engine?: string;
  drivetrain?: string;
  transmission?: string;
  fuelType?: string;
  msrpCents: number | null;
  retailCents: number | null;
  wholesaleCents: number | null;
  tradeInCents: number | null;
  brandCount: number;
  recallCount: number;
  hasOpenLien: boolean;
  hasTheftFlag: boolean;
  historySummary: string;
};

function ttlFor(org: Organization, endpoint: CarsxeEndpoint): number {
  const mapped = DEFAULT_CACHE_TTL_HOURS[endpoint];
  if (endpoint === "marketvalue") return Math.min(mapped, org.cacheTtlHours);
  if (mapped <= 24) return org.cacheTtlHours;
  return mapped;
}

function resolveApiKey(org: Organization): string | null {
  if (!org.carsxeKeyCipher) return null;
  return decryptSecret(org.carsxeKeyCipher, getEncryptionKey());
}

async function logUsage(input: {
  organizationId: string;
  userId?: string | null;
  endpoint: CarsxeEndpoint;
  action: string;
  vin?: string;
  billed: boolean;
  cacheHit: boolean;
  demo: boolean;
}) {
  await prisma.apiUsage.create({
    data: {
      organizationId: input.organizationId,
      userId: input.userId ?? undefined,
      endpoint: input.endpoint,
      action: input.action,
      vin: input.vin,
      billed: input.billed,
      cacheHit: input.cacheHit,
      demo: input.demo,
    },
  });
}

function fixtureForEndpoint(vin: string, endpoint: CarsxeEndpoint): unknown {
  const pack = getFixtureVin(vin) ?? defaultFixture();
  switch (endpoint) {
    case "specs":
      return pack.specs;
    case "marketvalue":
      return pack.marketValue;
    case "history":
      return pack.history;
    case "recalls":
      return pack.recalls;
    case "lien-theft":
      return pack.lienTheft;
    case "images":
      return pack.images;
    case "international-vin":
      return internationalFixture(vin);
    default:
      return pack.specs;
  }
}

export async function carsxeCall<T>(input: {
  org: Organization;
  userId?: string | null;
  endpoint: CarsxeEndpoint;
  action: string;
  params: Record<string, string | number | boolean | undefined | null>;
  vin?: string;
  live: (client: CarsxeClient) => Promise<T>;
}): Promise<CallResult<T>> {
  const cacheKey = cacheKeyFor(input.params);
  const cached = await prisma.apiCache.findUnique({
    where: {
      organizationId_endpoint_cacheKey: {
        organizationId: input.org.id,
        endpoint: input.endpoint,
        cacheKey,
      },
    },
  });

  if (cached && cached.expiresAt > new Date()) {
    const meta: CallMeta = {
      endpoint: input.endpoint,
      billed: false,
      cacheHit: true,
      demo: input.org.demoMode,
    };
    await logUsage({
      organizationId: input.org.id,
      userId: input.userId,
      endpoint: input.endpoint,
      action: input.action,
      vin: input.vin,
      billed: false,
      cacheHit: true,
      demo: input.org.demoMode,
    });
    return { data: cached.payload as T, meta };
  }

  let data: T;
  const demo = input.org.demoMode;

  if (input.org.demoMode) {
    data = fixtureForEndpoint(input.vin ?? String(input.params.vin ?? ""), input.endpoint) as T;
  } else {
    const apiKey = resolveApiKey(input.org);
    if (!apiKey) {
      throw new Error("Connect a CarsXE API key in Settings before running live lookups.");
    }
    const client = new CarsxeClient({
      apiKey,
      baseUrl: getCarsxeApiBaseUrl(),
    });
    data = await input.live(client);
  }

  const hours = ttlFor(input.org, input.endpoint);
  await prisma.apiCache.upsert({
    where: {
      organizationId_endpoint_cacheKey: {
        organizationId: input.org.id,
        endpoint: input.endpoint,
        cacheKey,
      },
    },
    create: {
      organizationId: input.org.id,
      endpoint: input.endpoint,
      cacheKey,
      payload: data as object,
      expiresAt: new Date(Date.now() + hours * 60 * 60 * 1000),
    },
    update: {
      payload: data as object,
      fetchedAt: new Date(),
      expiresAt: new Date(Date.now() + hours * 60 * 60 * 1000),
    },
  });

  const billed = !demo;
  await logUsage({
    organizationId: input.org.id,
    userId: input.userId,
    endpoint: input.endpoint,
    action: input.action,
    vin: input.vin,
    billed,
    cacheHit: false,
    demo,
  });

  return {
    data,
    meta: { endpoint: input.endpoint, billed, cacheHit: false, demo },
  };
}

export function summarizeDesk(input: {
  specs: SpecsResponse;
  marketValue: MarketValueResponse;
  history: HistoryResponse;
  recalls: RecallsResponse;
  lienTheft: LienTheftResponse | null;
}): DeskSummary {
  const attrs = input.specs.attributes ?? {};
  const exterior = input.specs.colors?.find((c) => c.category?.toLowerCase().includes("exterior"));
  const recalls = extractRecalls(input.recalls);
  const events = input.lienTheft?.events ?? input.history.lienTheft?.events ?? [];
  const hasOpenLien = events.some((event) => (event.event ?? "").toLowerCase().includes("lien"));
  const hasTheftFlag = events.some((event) => (event.event ?? "").toLowerCase().includes("theft"));
  const brands = input.history.brandsInformation ?? [];
  const bits: string[] = [];
  if (brands.length) bits.push(`${brands.length} title brand${brands.length === 1 ? "" : "s"}`);
  if (input.history.junkAndSalvageInformation?.length) bits.push("junk/salvage record");
  if (hasOpenLien) bits.push("open lien");
  if (hasTheftFlag) bits.push("theft flag");
  if (recalls.length) bits.push(`${recalls.length} open recall${recalls.length === 1 ? "" : "s"}`);
  if (!bits.length) bits.push("No title brands, liens, theft flags, or open recalls on file");

  const msrp = attrs.manufacturer_suggested_retail_price
    ? Math.round(Number(attrs.manufacturer_suggested_retail_price) * 100)
    : typeof input.marketValue.msrp === "number"
      ? Math.round(input.marketValue.msrp * 100)
      : null;

  return {
    year: attrs.year ?? String(input.marketValue.model_year ?? ""),
    make: attrs.make ?? input.marketValue.make,
    model: attrs.model ?? input.marketValue.model,
    trim: attrs.trim ?? input.marketValue.series,
    bodyStyle: attrs.style ?? input.marketValue.style,
    color: exterior?.name,
    engine: attrs.engine,
    drivetrain: attrs.drivetrain,
    transmission: attrs.transmission,
    fuelType: attrs.fuel_type,
    msrpCents: Number.isFinite(msrp) ? msrp : null,
    retailCents: dollarsToCentsOrNull(adjustedBandValue(input.marketValue.retail_clean, "retail_clean")),
    wholesaleCents: dollarsToCentsOrNull(adjustedBandValue(input.marketValue.whole_clean, "whole_clean")),
    tradeInCents: dollarsToCentsOrNull(adjustedBandValue(input.marketValue.trade_in_clean, "trade_in_clean")),
    brandCount: input.history.brandsRecordCount ?? brands.length,
    recallCount: recalls.length,
    hasOpenLien,
    hasTheftFlag,
    historySummary: bits.join(" · "),
  };
}

function dollarsToCentsOrNull(value: number | null): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  return Math.round(value * 100);
}

export async function lookupDesk(input: {
  org: Organization;
  userId?: string | null;
  vin?: string;
  plate?: string;
  plateState?: string;
  mileage?: number;
  condition?: CarsxeCondition;
  state?: string;
}): Promise<DeskLookup> {
  const usage: CallMeta[] = [];
  let vin = input.vin?.trim().toUpperCase() ?? "";
  const plate = input.plate?.trim().toUpperCase();
  const plateState = input.plateState?.trim().toUpperCase();

  if (!vin && plate && plateState) {
    const plateResult = await carsxeCall<UsPlateDecoderResponse>({
      org: input.org,
      userId: input.userId,
      endpoint: "us-plate-decoder",
      action: "Decode plate",
      params: { plate, state: plateState },
      live: (client) => client.usPlateDecoder({ plate: plate!, state: plateState! }),
    });
    usage.push(plateResult.meta);
    if (input.org.demoMode) {
      const fixture = getPlateFixture(plate, plateState);
      if (fixture?.vin) vin = fixture.vin;
      else if (plateResult.data.vin) vin = plateResult.data.vin;
    } else if (plateResult.data.vin) {
      vin = plateResult.data.vin.toUpperCase();
    }
    if (!vin) {
      throw new Error("CarsXE did not return a VIN for that plate.");
    }
  }

  if (vin.length !== 17) {
    throw new Error("Enter a 17-character VIN or a US plate and state.");
  }

  const [specs, marketValue, history, recalls] = await Promise.all([
    carsxeCall<SpecsResponse>({
      org: input.org,
      userId: input.userId,
      endpoint: "specs",
      action: "Decode VIN",
      params: { vin },
      vin,
      live: (client) => client.specs(vin),
    }),
    carsxeCall<MarketValueResponse>({
      org: input.org,
      userId: input.userId,
      endpoint: "marketvalue",
      action: "Market value",
      params: {
        vin,
        mileage: input.mileage,
        condition: input.condition,
        state: input.state,
      },
      vin,
      live: (client) =>
        client.marketValue({
          vin,
          mileage: input.mileage,
          condition: input.condition,
          state: input.state,
        }),
    }),
    carsxeCall<HistoryResponse>({
      org: input.org,
      userId: input.userId,
      endpoint: "history",
      action: "History + title",
      params: { vin, lienTheft: "true" },
      vin,
      live: (client) => client.history(vin, true),
    }),
    carsxeCall<RecallsResponse>({
      org: input.org,
      userId: input.userId,
      endpoint: "recalls",
      action: "Recall check",
      params: { vin },
      vin,
      live: (client) => client.recalls(vin),
    }),
  ]);
  usage.push(specs.meta, marketValue.meta, history.meta, recalls.meta);

  let lienTheft: CallResult<LienTheftResponse> | null = null;
  if (!history.data.lienTheft) {
    try {
      lienTheft = await carsxeCall<LienTheftResponse>({
        org: input.org,
        userId: input.userId,
        endpoint: "lien-theft",
        action: "Lien & theft",
        params: { vin },
        vin,
        live: (client) => client.lienTheft(vin),
      });
      usage.push(lienTheft.meta);
    } catch (error) {
      if (!(error instanceof CarsxeError && error.status === 404)) {
        throw error;
      }
    }
  }

  const make = specs.data.attributes?.make ?? marketValue.data.make ?? "Unknown";
  const model = specs.data.attributes?.model ?? marketValue.data.model ?? "Unknown";
  const year = specs.data.attributes?.year ?? String(marketValue.data.model_year ?? "");
  const images = await carsxeCall<ImagesResponse>({
    org: input.org,
    userId: input.userId,
    endpoint: "images",
    action: "Merchandising images",
    params: { make, model, year },
    vin,
    live: (client) => client.images({ make, model, year }),
  });
  usage.push(images.meta);

  const lien = lienTheft?.data ?? history.data.lienTheft ?? null;
  const summary = summarizeDesk({
    specs: specs.data,
    marketValue: marketValue.data,
    history: history.data,
    recalls: recalls.data,
    lienTheft: lien,
  });

  return {
    vin,
    plate,
    plateState,
    specs: specs.data,
    marketValue: marketValue.data,
    history: history.data,
    recalls: recalls.data,
    lienTheft: lien,
    images: images.data,
    summary,
    usage,
  };
}

export function usageTotals(usage: CallMeta[]) {
  return {
    total: usage.length,
    billed: usage.filter((item) => item.billed).length,
    cached: usage.filter((item) => item.cacheHit).length,
    demo: usage.filter((item) => item.demo).length,
  };
}

export async function decodeInternationalVin(input: {
  org: Organization;
  userId?: string | null;
  vin: string;
}): Promise<CallResult<InternationalVinResponse>> {
  return carsxeCall<InternationalVinResponse>({
    org: input.org,
    userId: input.userId,
    endpoint: "international-vin",
    action: "International VIN",
    params: { vin: input.vin },
    vin: input.vin,
    live: (client) => client.internationalVin(input.vin),
  });
}
