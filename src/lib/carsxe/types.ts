export type CarsxeEndpoint =
  | "specs"
  | "marketvalue"
  | "history"
  | "recalls"
  | "lien-theft"
  | "us-plate-decoder"
  | "platedecoder"
  | "images"
  | "international-vin";

export type CarsxeErrorBody = {
  success?: boolean;
  message?: string;
  code?: string;
};

export type SpecsColor = {
  category?: string;
  name?: string;
};

export type SpecsWarranty = {
  type?: string;
  miles?: string;
  months?: string;
};

export type SpecsResponse = {
  success: boolean;
  input?: { key?: string; vin?: string };
  attributes?: {
    year?: string;
    make?: string;
    model?: string;
    trim?: string;
    style?: string;
    type?: string;
    made_in?: string;
    made_in_city?: string;
    doors?: string;
    fuel_type?: string;
    fuel_capacity?: string;
    city_mileage?: string;
    highway_mileage?: string;
    engine?: string;
    engine_size?: string;
    engine_cylinders?: string;
    transmission?: string;
    transmission_short?: string;
    drivetrain?: string;
    anti_brake_system?: string;
    steering_type?: string;
    curb_weight?: string;
    gross_vehicle_weight_rating?: string;
    overall_height?: string;
    overall_length?: string;
    overall_width?: string;
    standard_seating?: string;
    invoice_price?: string;
    delivery_charges?: string;
    manufacturer_suggested_retail_price?: string;
  };
  colors?: SpecsColor[];
  equipment?: Record<string, string>;
  warranties?: SpecsWarranty[];
  timestamp?: string;
};

export type MarketValueBand = {
  [key: string]: number | undefined;
};

export type MarketValueResponse = {
  uid?: string;
  input?: { vin?: string; state?: string; country?: string; mileage?: number; condition?: string };
  publish_date?: string;
  state?: string;
  country?: string;
  model_year?: string | number;
  make?: string;
  model?: string;
  series?: string;
  style?: string;
  class_name?: string;
  msrp?: number;
  whole_xclean?: MarketValueBand;
  whole_clean?: MarketValueBand;
  whole_avg?: MarketValueBand;
  whole_rough?: MarketValueBand;
  retail_xclean?: MarketValueBand;
  retail_clean?: MarketValueBand;
  retail_avg?: MarketValueBand;
  retail_rough?: MarketValueBand;
  trade_in_clean?: MarketValueBand;
  trade_in_avg?: MarketValueBand;
  trade_in_rough?: MarketValueBand;
  [key: string]: unknown;
};

export type HistoryBrand = {
  name?: string;
  code?: string;
  description?: string;
};

export type HistoryTitle = {
  TitleIssuingAuthorityName?: string;
  TitleIssueDate?: { Date?: string };
  VehicleOdometerReadingMeasure?: string;
  VehicleOdometerReadingUnitCode?: string;
};

export type HistoryJunkRecord = {
  ReportingEntityAbstract?: {
    ReportingEntityCategoryText?: string;
    EntityName?: string;
    LocationCityName?: string;
    LocationStateUSPostalServiceCode?: string;
  };
  VehicleObtainedDate?: string;
  VehicleDispositionText?: string;
  VehicleIntendedForExportCode?: string;
};

export type LienTheftEvent = {
  date?: string;
  event?: string;
  location?: string;
  details_list?: string[];
  lienholder?: string;
};

export type LienTheftResponse = {
  success: boolean;
  message?: string;
  input?: { vin?: string };
  timestamp?: string;
  year?: number | string;
  make?: string;
  model?: string;
  type?: string;
  events?: LienTheftEvent[];
  trim_data?: Record<string, Record<string, string>>;
};

export type HistoryResponse = {
  success: boolean;
  vin?: string;
  junkAndSalvageInformation?: HistoryJunkRecord[];
  insuranceInformation?: unknown[];
  brandsRecordCount?: number;
  brandsInformation?: HistoryBrand[];
  vinChanged?: boolean;
  currentTitleInformation?: HistoryTitle[];
  historyInformation?: Array<
    HistoryTitle & { VehicleIdentification?: { IdentificationID?: string } }
  >;
  lienTheft?: LienTheftResponse;
};

export type RecallRecord = {
  NHTSACampaignNumber?: string;
  campaign_number?: string;
  Component?: string;
  component?: string;
  Summary?: string;
  summary?: string;
  Consequence?: string;
  consequence?: string;
  Remedy?: string;
  remedy?: string;
  ReportReceivedDate?: string;
  report_received_date?: string;
};

export type RecallsResponse = {
  success: boolean;
  input?: { vin?: string };
  data?: {
    uuid?: string;
    vin?: string;
    manufacturer?: string;
    model_year?: string;
    recalls?: RecallRecord[];
    [key: string]: unknown;
  };
  recalls?: RecallRecord[];
  timestamp?: string;
  message?: string;
};

export type UsPlateDecoderResponse = {
  success: boolean;
  input?: { plate?: string; state?: string };
  vin?: string;
  year?: string;
  make?: string;
  model?: string;
  trim?: string;
  description?: string;
  engine_size?: string;
  body_style?: string;
  transmission?: string;
  drive_type?: string;
  fuel_type?: string;
  color?: string;
  vehicle_specs?: SpecsResponse;
};

export type PlateDecoderResponse = {
  success: boolean;
  input?: { plate?: string; state?: string; country?: string };
  vin?: string;
  year?: string | number;
  make?: string;
  model?: string;
  trim?: string;
  [key: string]: unknown;
};

export type VehicleImage = {
  mime?: string;
  link?: string;
  contextLink?: string;
  height?: string | number;
  width?: string | number;
  byteSize?: number;
  thumbnailLink?: string;
  thumbnailHeight?: string | number;
  thumbnailWidth?: string | number;
};

export type ImagesResponse = {
  success: boolean;
  query?: { make?: string; model?: string; year?: string; angle?: string };
  images: VehicleImage[];
};

export type InternationalVinResponse = {
  success: boolean;
  input?: { vin?: string };
  attributes?: {
    vin?: string;
    vid?: string;
    make?: string;
    model?: string;
    year?: string;
    [key: string]: string | undefined;
  };
  timestamp?: string;
};

export type CarsxeCondition = "excellent" | "clean" | "average" | "rough";

export const DEFAULT_CACHE_TTL_HOURS: Record<CarsxeEndpoint, number> = {
  specs: 168,
  images: 168,
  "us-plate-decoder": 168,
  platedecoder: 168,
  "international-vin": 168,
  marketvalue: 12,
  history: 24,
  recalls: 24,
  "lien-theft": 24,
};

export const ENDPOINT_DOCS: Record<CarsxeEndpoint, string> = {
  specs: "https://docs.carsxe.com/docs/products/specifications",
  marketvalue: "https://docs.carsxe.com/docs/products/market-value",
  history: "https://docs.carsxe.com/docs/products/vehicle-history",
  recalls: "https://docs.carsxe.com/docs/products/recalls",
  "lien-theft": "https://docs.carsxe.com/docs/products/lien-theft",
  "us-plate-decoder": "https://docs.carsxe.com/docs/products/us-plate-decoder",
  platedecoder: "https://docs.carsxe.com/docs/products/plate-decoder",
  images: "https://docs.carsxe.com/docs/products/vehicle-images",
  "international-vin": "https://docs.carsxe.com/docs/products/international-vin-decoder",
};

export const ENDPOINT_PATH: Record<CarsxeEndpoint, string> = {
  specs: "/specs",
  marketvalue: "/v2/marketvalue",
  history: "/history",
  recalls: "/v1/recalls",
  "lien-theft": "/v1/lien-theft",
  "us-plate-decoder": "/us-plate-decoder",
  platedecoder: "/v2/platedecoder",
  images: "/images",
  "international-vin": "/v1/international-vin-decoder",
};

export function adjustedBandValue(band: MarketValueBand | undefined, prefix: string): number | null {
  if (!band) return null;
  const adjusted = band[`adjusted_${prefix}`];
  if (typeof adjusted === "number") return adjusted;
  const base = band[`base_${prefix}`];
  return typeof base === "number" ? base : null;
}

export function extractRecalls(response: RecallsResponse): RecallRecord[] {
  if (Array.isArray(response.recalls)) return response.recalls;
  if (Array.isArray(response.data?.recalls)) return response.data.recalls;
  return [];
}
