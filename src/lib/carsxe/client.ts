import { getCarsxeApiBaseUrl } from "@/lib/env";
import type {
  CarsxeCondition,
  CarsxeEndpoint,
  HistoryResponse,
  ImagesResponse,
  InternationalVinResponse,
  LienTheftResponse,
  MarketValueResponse,
  PlateDecoderResponse,
  RecallsResponse,
  SpecsResponse,
  UsPlateDecoderResponse,
} from "@/lib/carsxe/types";
import { ENDPOINT_PATH } from "@/lib/carsxe/types";

export class CarsxeError extends Error {
  constructor(
    public readonly status: number,
    public readonly endpoint: CarsxeEndpoint,
    public readonly body: unknown,
    message: string,
  ) {
    super(message);
    this.name = "CarsxeError";
  }
}

export type CarsxeClientOptions = {
  apiKey: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

export class CarsxeClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: CarsxeClientOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? getCarsxeApiBaseUrl()).replace(/\/$/, "");
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async specs(vin: string): Promise<SpecsResponse> {
    return this.get("specs", { vin, format: "json" });
  }

  async marketValue(input: {
    vin: string;
    state?: string;
    mileage?: number;
    condition?: CarsxeCondition;
  }): Promise<MarketValueResponse> {
    return this.get("marketvalue", {
      vin: input.vin,
      state: input.state,
      mileage: input.mileage,
      condition: input.condition,
    });
  }

  async history(vin: string, lienTheft = false): Promise<HistoryResponse> {
    return this.get("history", {
      vin,
      format: "json",
      lienTheft: lienTheft ? "true" : undefined,
    });
  }

  async recalls(vin: string): Promise<RecallsResponse> {
    return this.get("recalls", { vin });
  }

  async lienTheft(vin: string): Promise<LienTheftResponse> {
    return this.get("lien-theft", { vin });
  }

  async usPlateDecoder(input: {
    plate: string;
    state: string;
    decodeVin?: boolean;
  }): Promise<UsPlateDecoderResponse> {
    return this.get("us-plate-decoder", {
      plate: input.plate,
      state: input.state,
      decodeVIN: input.decodeVin ? "true" : undefined,
    });
  }

  async plateDecoder(input: {
    plate: string;
    country: string;
    state: string;
  }): Promise<PlateDecoderResponse> {
    return this.get("platedecoder", {
      plate: input.plate,
      country: input.country,
      state: input.state,
    });
  }

  async images(input: {
    make: string;
    model: string;
    year?: string | number;
    trim?: string;
    color?: string;
    angle?: "front" | "side" | "back";
  }): Promise<ImagesResponse> {
    return this.get("images", {
      make: input.make,
      model: input.model,
      year: input.year,
      trim: input.trim,
      color: input.color,
      angle: input.angle,
    });
  }

  async internationalVin(vin: string): Promise<InternationalVinResponse> {
    return this.get("international-vin", { vin });
  }

  private async get<T>(
    endpoint: CarsxeEndpoint,
    params: Record<string, string | number | boolean | undefined>,
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${ENDPOINT_PATH[endpoint]}`);
    url.searchParams.set("key", this.apiKey);
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === "") continue;
      url.searchParams.set(key, String(value));
    }

    const response = await this.fetchImpl(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }

    if (!response.ok) {
      const record = asRecord(body);
      throw new CarsxeError(
        response.status,
        endpoint,
        body,
        typeof record.message === "string" ? record.message : `CarsXE ${endpoint} failed (${response.status})`,
      );
    }

    return body as T;
  }
}
