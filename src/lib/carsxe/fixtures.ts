import type {
  HistoryResponse,
  ImagesResponse,
  InternationalVinResponse,
  LienTheftResponse,
  MarketValueResponse,
  RecallsResponse,
  SpecsResponse,
  UsPlateDecoderResponse,
} from "@/lib/carsxe/types";

export const DEMO_PLATE = { plate: "H37SFS", state: "NJ", vin: "1GNSCGKC0JR318026" };

type FixturePack = {
  specs: SpecsResponse;
  marketValue: MarketValueResponse;
  history: HistoryResponse;
  recalls: RecallsResponse;
  lienTheft: LienTheftResponse;
  images: ImagesResponse;
};

function moneyBands(base: {
  whole: number;
  retail: number;
  trade: number;
}): Pick<
  MarketValueResponse,
  | "whole_xclean"
  | "whole_clean"
  | "whole_avg"
  | "whole_rough"
  | "retail_xclean"
  | "retail_clean"
  | "retail_avg"
  | "retail_rough"
  | "trade_in_clean"
  | "trade_in_avg"
  | "trade_in_rough"
> {
  const w = base.whole;
  const r = base.retail;
  const t = base.trade;
  const band = (prefix: string, value: number) => ({
    [`base_${prefix}`]: value,
    [`mileage_${prefix}`]: 0,
    [`add_deduct_${prefix}`]: 0,
    [`regional_${prefix}`]: 0,
    [`adjusted_${prefix}`]: value,
  });
  return {
    whole_xclean: band("whole_xclean", Math.round(w * 1.18)),
    whole_clean: band("whole_clean", w),
    whole_avg: band("whole_avg", Math.round(w * 0.78)),
    whole_rough: band("whole_rough", Math.round(w * 0.52)),
    retail_xclean: band("retail_xclean", Math.round(r * 1.12)),
    retail_clean: band("retail_clean", r),
    retail_avg: band("retail_avg", Math.round(r * 0.82)),
    retail_rough: band("retail_rough", Math.round(r * 0.64)),
    trade_in_clean: band("trade_in_clean", t),
    trade_in_avg: band("trade_in_avg", Math.round(t * 0.78)),
    trade_in_rough: band("trade_in_rough", Math.round(t * 0.5)),
  };
}

function imageSet(year: string, make: string, model: string): ImagesResponse {
  const q = (angle: string) =>
    `/api/demo-image?year=${encodeURIComponent(year)}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&angle=${angle}`;
  return {
    success: true,
    query: { make, model, year },
    images: [
      {
        mime: "image/svg+xml",
        link: q("front"),
        contextLink: "https://docs.carsxe.com/docs/products/vehicle-images",
        width: 1280,
        height: 720,
      },
      {
        mime: "image/svg+xml",
        link: q("side"),
        contextLink: "https://docs.carsxe.com/docs/products/vehicle-images",
        width: 1280,
        height: 720,
      },
    ],
  };
}

const CAMRY: FixturePack = {
  specs: {
    success: true,
    input: { vin: "4T1G11AK1NU012345" },
    attributes: {
      year: "2022",
      make: "Toyota",
      model: "Camry",
      trim: "XLE",
      style: "SEDAN 4-DR",
      type: "Sedan/Saloon",
      made_in: "UNITED STATES",
      doors: "4",
      fuel_type: "Gasoline",
      city_mileage: "28",
      highway_mileage: "39",
      engine: "2.5L I4 DOHC 16V",
      engine_cylinders: "4",
      transmission: "8-Speed Automatic",
      drivetrain: "FWD",
      standard_seating: "5",
      manufacturer_suggested_retail_price: "30400",
    },
    colors: [
      { category: "Exterior", name: "Celestial Silver Metallic" },
      { category: "Interior", name: "Black SofTex" },
    ],
    equipment: {
      abs_brakes: "Std.",
      air_conditioning: "Std.",
      alloy_wheels: "Std.",
      backup_camera: "Std.",
      bluetooth: "Std.",
      adaptive_cruise: "Std.",
    },
    warranties: [
      { type: "Basic", miles: "36,000 mile", months: "36 month" },
      { type: "Powertrain", miles: "60,000 mile", months: "60 month" },
    ],
  },
  marketValue: {
    input: { vin: "4T1G11AK1NU012345", state: "OR", country: "US" },
    model_year: "2022",
    make: "Toyota",
    model: "Camry",
    series: "XLE",
    style: "4D Sedan",
    class_name: "Midsize Car",
    msrp: 30400,
    ...moneyBands({ whole: 21400, retail: 24900, trade: 19800 }),
  },
  history: {
    success: true,
    vin: "4T1G11AK1NU012345",
    junkAndSalvageInformation: [],
    insuranceInformation: [],
    brandsRecordCount: 0,
    brandsInformation: [],
    vinChanged: false,
    currentTitleInformation: [
      {
        TitleIssuingAuthorityName: "OR",
        TitleIssueDate: { Date: "2023-03-12T00:00:00.000Z" },
        VehicleOdometerReadingMeasure: "000018440",
        VehicleOdometerReadingUnitCode: "M",
      },
    ],
    historyInformation: [
      {
        VehicleIdentification: { IdentificationID: "4T1G11AK1NU012345" },
        TitleIssuingAuthorityName: "OR",
        TitleIssueDate: { Date: "2022-04-02T00:00:00.000Z" },
        VehicleOdometerReadingMeasure: "000000012",
        VehicleOdometerReadingUnitCode: "M",
      },
    ],
  },
  recalls: {
    success: true,
    input: { vin: "4T1G11AK1NU012345" },
    data: {
      vin: "4T1G11AK1NU012345",
      manufacturer: "TOYOTA MOTOR MANUFACTURING",
      model_year: "2022",
      recalls: [],
    },
  },
  lienTheft: {
    success: false,
    message: "No lien or theft data found for this VIN",
  },
  images: imageSet("2022", "Toyota", "Camry"),
};

const CRV: FixturePack = {
  specs: {
    success: true,
    input: { vin: "2HKRW2H59MH123456" },
    attributes: {
      year: "2021",
      make: "Honda",
      model: "CR-V",
      trim: "EX",
      style: "SPORT UTILITY 4-DR",
      type: "Sport Utility Vehicle (SUV)/Multi-Purpose Vehicle (MPV)",
      made_in: "UNITED STATES",
      doors: "4",
      fuel_type: "Gasoline",
      city_mileage: "28",
      highway_mileage: "34",
      engine: "1.5L I4 DOHC 16V Turbo",
      engine_cylinders: "4",
      transmission: "CVT",
      drivetrain: "AWD",
      standard_seating: "5",
      manufacturer_suggested_retail_price: "29800",
    },
    colors: [
      { category: "Exterior", name: "Sonic Gray Pearl" },
      { category: "Interior", name: "Black Cloth" },
    ],
    equipment: { abs_brakes: "Std.", sunroof: "Std.", backup_camera: "Std." },
    warranties: [{ type: "Basic", miles: "36,000 mile", months: "36 month" }],
  },
  marketValue: {
    input: { vin: "2HKRW2H59MH123456", state: "OR" },
    model_year: "2021",
    make: "Honda",
    model: "CR-V",
    series: "EX",
    msrp: 29800,
    ...moneyBands({ whole: 19800, retail: 23200, trade: 18100 }),
  },
  history: {
    success: true,
    vin: "2HKRW2H59MH123456",
    junkAndSalvageInformation: [],
    insuranceInformation: [],
    brandsRecordCount: 0,
    brandsInformation: [],
    vinChanged: false,
    currentTitleInformation: [
      {
        TitleIssuingAuthorityName: "WA",
        TitleIssueDate: { Date: "2022-11-04T00:00:00.000Z" },
        VehicleOdometerReadingMeasure: "000031200",
        VehicleOdometerReadingUnitCode: "M",
      },
    ],
    historyInformation: [],
  },
  recalls: {
    success: true,
    data: {
      vin: "2HKRW2H59MH123456",
      manufacturer: "HONDA",
      model_year: "2021",
      recalls: [
        {
          NHTSACampaignNumber: "22V-441",
          Component: "FUEL SYSTEM, GASOLINE",
          Summary: "Fuel pump impeller may fail, causing a stall.",
          Consequence: "An engine stall increases the risk of a crash.",
          Remedy: "Dealers will replace the fuel pump free of charge.",
          ReportReceivedDate: "2022-06-16",
        },
      ],
    },
  },
  lienTheft: { success: false, message: "No lien or theft data found for this VIN" },
  images: imageSet("2021", "Honda", "CR-V"),
};

const F150: FixturePack = {
  specs: {
    success: true,
    input: { vin: "1FTEW1E49KFA77821" },
    attributes: {
      year: "2019",
      make: "Ford",
      model: "F-150",
      trim: "XLT",
      style: "CREW CAB PICKUP 4-DR",
      type: "Truck",
      made_in: "UNITED STATES",
      doors: "4",
      fuel_type: "Gasoline",
      city_mileage: "19",
      highway_mileage: "24",
      engine: "3.5L V6 DOHC 24V Twin Turbo",
      engine_cylinders: "6",
      transmission: "10-Speed Automatic",
      drivetrain: "4WD",
      standard_seating: "5",
      manufacturer_suggested_retail_price: "44500",
    },
    colors: [{ category: "Exterior", name: "Oxford White" }],
    equipment: { trailer_tow: "Std.", backup_camera: "Std." },
    warranties: [{ type: "Basic", miles: "36,000 mile", months: "36 month" }],
  },
  marketValue: {
    input: { vin: "1FTEW1E49KFA77821", state: "OR" },
    model_year: "2019",
    make: "Ford",
    model: "F-150",
    series: "XLT",
    msrp: 44500,
    ...moneyBands({ whole: 24600, retail: 28900, trade: 22800 }),
  },
  history: {
    success: true,
    vin: "1FTEW1E49KFA77821",
    junkAndSalvageInformation: [],
    insuranceInformation: [],
    brandsRecordCount: 0,
    brandsInformation: [],
    vinChanged: false,
    currentTitleInformation: [
      {
        TitleIssuingAuthorityName: "OR",
        TitleIssueDate: { Date: "2021-08-19T00:00:00.000Z" },
        VehicleOdometerReadingMeasure: "000054110",
        VehicleOdometerReadingUnitCode: "M",
      },
    ],
    historyInformation: [],
  },
  recalls: {
    success: true,
    data: { vin: "1FTEW1E49KFA77821", manufacturer: "FORD", model_year: "2019", recalls: [] },
  },
  lienTheft: { success: false, message: "No lien or theft data found for this VIN" },
  images: imageSet("2019", "Ford", "F-150"),
};

const BMW3: FixturePack = {
  specs: {
    success: true,
    input: { vin: "WBA5R1C50LAF22331" },
    attributes: {
      year: "2020",
      make: "BMW",
      model: "3-Series",
      trim: "330i",
      style: "SEDAN 4-DR",
      type: "Sedan/Saloon",
      made_in: "GERMANY",
      doors: "4",
      fuel_type: "Gasoline",
      city_mileage: "26",
      highway_mileage: "36",
      engine: "2.0L I4 DOHC 16V Turbo",
      engine_cylinders: "4",
      transmission: "8-Speed Automatic",
      drivetrain: "RWD",
      standard_seating: "5",
      manufacturer_suggested_retail_price: "40900",
    },
    colors: [{ category: "Exterior", name: "Alpine White" }],
    equipment: { leather_seats: "Opt.", navigation: "Std." },
    warranties: [{ type: "Basic", miles: "36,000 mile", months: "48 month" }],
  },
  marketValue: {
    input: { vin: "WBA5R1C50LAF22331", state: "OR" },
    model_year: "2020",
    make: "BMW",
    model: "3-Series",
    series: "330i",
    msrp: 40900,
    ...moneyBands({ whole: 22100, retail: 26800, trade: 20400 }),
  },
  history: {
    success: true,
    vin: "WBA5R1C50LAF22331",
    junkAndSalvageInformation: [],
    insuranceInformation: [],
    brandsRecordCount: 0,
    brandsInformation: [],
    vinChanged: false,
    currentTitleInformation: [
      {
        TitleIssuingAuthorityName: "CA",
        TitleIssueDate: { Date: "2021-01-14T00:00:00.000Z" },
        VehicleOdometerReadingMeasure: "000011900",
        VehicleOdometerReadingUnitCode: "M",
      },
    ],
    historyInformation: [],
  },
  recalls: {
    success: true,
    data: { vin: "WBA5R1C50LAF22331", manufacturer: "BMW", model_year: "2020", recalls: [] },
  },
  lienTheft: { success: false, message: "No lien or theft data found for this VIN" },
  images: imageSet("2020", "BMW", "3-Series"),
};

const SUBURBAN: FixturePack = {
  specs: {
    success: true,
    input: { vin: "1GNSCGKC0JR318026" },
    attributes: {
      year: "2018",
      make: "Chevrolet",
      model: "Suburban",
      trim: "LS",
      style: "SPORT UTILITY 4-DR",
      type: "Sport Utility Vehicle (SUV)/Multi-Purpose Vehicle (MPV)",
      made_in: "UNITED STATES",
      doors: "4",
      fuel_type: "Flexible-Fuel",
      city_mileage: "15",
      highway_mileage: "22",
      engine: "5.3L V8 OHV 16V",
      engine_cylinders: "8",
      transmission: "6-Speed Automatic",
      drivetrain: "RWD",
      standard_seating: "8",
      manufacturer_suggested_retail_price: "50800",
    },
    colors: [{ category: "Exterior", name: "Black" }],
    equipment: { third_row: "Std.", trailer_tow: "Std." },
    warranties: [{ type: "Basic", miles: "36,000 mile", months: "36 month" }],
  },
  marketValue: {
    input: { vin: "1GNSCGKC0JR318026", state: "OR" },
    model_year: "2018",
    make: "Chevrolet",
    model: "Suburban",
    series: "LS",
    msrp: 50800,
    ...moneyBands({ whole: 18400, retail: 22900, trade: 16800 }),
  },
  history: {
    success: true,
    vin: "1GNSCGKC0JR318026",
    junkAndSalvageInformation: [],
    insuranceInformation: [],
    brandsRecordCount: 1,
    brandsInformation: [{ name: "Fleet", code: "17", description: "Prior fleet or commercial use" }],
    vinChanged: false,
    currentTitleInformation: [
      {
        TitleIssuingAuthorityName: "NJ",
        TitleIssueDate: { Date: "2020-05-01T00:00:00.000Z" },
        VehicleOdometerReadingMeasure: "000062440",
        VehicleOdometerReadingUnitCode: "M",
      },
    ],
    historyInformation: [],
  },
  recalls: {
    success: true,
    data: { vin: "1GNSCGKC0JR318026", manufacturer: "GENERAL MOTORS", model_year: "2018", recalls: [] },
  },
  lienTheft: { success: false, message: "No lien or theft data found for this VIN" },
  images: imageSet("2018", "Chevrolet", "Suburban"),
};

const WRANGLER: FixturePack = {
  specs: {
    success: true,
    input: { vin: "1C4JJXR64PW696340" },
    attributes: {
      year: "2023",
      make: "Jeep",
      model: "Wrangler",
      trim: "Rubicon",
      style: "SPORT UTILITY 2-DR",
      type: "Sport Utility Vehicle (SUV)/Multi-Purpose Vehicle (MPV)",
      made_in: "UNITED STATES",
      doors: "2",
      fuel_type: "Gasoline",
      city_mileage: "17",
      highway_mileage: "25",
      engine: "3.6L V6 DOHC 24V",
      engine_cylinders: "6",
      transmission: "8-Speed Automatic",
      drivetrain: "4WD",
      standard_seating: "4",
      manufacturer_suggested_retail_price: "51900",
    },
    colors: [{ category: "Exterior", name: "Hydro Blue Pearl" }],
    equipment: { removable_top: "Std.", offroad_package: "Std." },
    warranties: [{ type: "Basic", miles: "36,000 mile", months: "36 month" }],
  },
  marketValue: {
    input: { vin: "1C4JJXR64PW696340", state: "OR" },
    model_year: "2023",
    make: "Jeep",
    model: "Wrangler",
    series: "Rubicon",
    msrp: 51900,
    ...moneyBands({ whole: 36200, retail: 41800, trade: 33900 }),
  },
  history: {
    success: true,
    vin: "1C4JJXR64PW696340",
    junkAndSalvageInformation: [],
    insuranceInformation: [],
    brandsRecordCount: 0,
    brandsInformation: [],
    vinChanged: false,
    currentTitleInformation: [
      {
        TitleIssuingAuthorityName: "OR",
        TitleIssueDate: { Date: "2024-02-11T00:00:00.000Z" },
        VehicleOdometerReadingMeasure: "000008120",
        VehicleOdometerReadingUnitCode: "M",
      },
    ],
    historyInformation: [],
  },
  recalls: {
    success: true,
    data: {
      vin: "1C4JJXR64PW696340",
      manufacturer: "FCA US LLC",
      model_year: "2023",
      recalls: [
        {
          NHTSACampaignNumber: "24V-118",
          Component: "STEERING",
          Summary: "Steering shaft fastener may loosen.",
          Consequence: "Loss of steering control can increase crash risk.",
          Remedy: "Dealers will inspect and tighten or replace the fastener.",
          ReportReceivedDate: "2024-02-22",
        },
      ],
    },
  },
  lienTheft: { success: false, message: "No lien or theft data found for this VIN" },
  images: imageSet("2023", "Jeep", "Wrangler"),
};

const FORTE: FixturePack = {
  specs: {
    success: true,
    input: { vin: "3KPFK4A78HE103497" },
    attributes: {
      year: "2017",
      make: "Kia",
      model: "Forte",
      trim: "LX",
      style: "SEDAN 4-DR",
      type: "Sedan/Saloon",
      made_in: "UNITED STATES",
      doors: "4",
      fuel_type: "Gasoline",
      city_mileage: "29",
      highway_mileage: "38",
      engine: "2.0L I4 MPI DOHC",
      engine_cylinders: "4",
      transmission: "6-Speed Automatic",
      drivetrain: "FWD",
      standard_seating: "5",
      manufacturer_suggested_retail_price: "17600",
    },
    colors: [{ category: "Exterior", name: "Snow White Pearl" }],
    equipment: { air_conditioning: "Std.", abs_brakes: "Std." },
    warranties: [{ type: "Basic", miles: "60,000 mile", months: "60 month" }],
  },
  marketValue: {
    uid: "6AA32D4C",
    input: { vin: "3KPFK4A78HE103497", state: "CA", country: "US" },
    model_year: "2017",
    make: "Kia",
    model: "Forte",
    series: "LX",
    style: "4D Sedan",
    class_name: "Small Car",
    msrp: 17600,
    ...moneyBands({ whole: 4975, retail: 8600, trade: 5080 }),
  },
  history: {
    success: true,
    vin: "3KPFK4A78HE103497",
    junkAndSalvageInformation: [],
    insuranceInformation: [],
    brandsRecordCount: 0,
    brandsInformation: [],
    vinChanged: false,
    currentTitleInformation: [
      {
        TitleIssuingAuthorityName: "CA",
        TitleIssueDate: { Date: "2019-09-08T00:00:00.000Z" },
        VehicleOdometerReadingMeasure: "000041225",
        VehicleOdometerReadingUnitCode: "M",
      },
    ],
    historyInformation: [],
  },
  recalls: {
    success: true,
    data: { vin: "3KPFK4A78HE103497", manufacturer: "KIA", model_year: "2017", recalls: [] },
  },
  lienTheft: { success: false, message: "No lien or theft data found for this VIN" },
  images: imageSet("2017", "Kia", "Forte"),
};

const CHARGER: FixturePack = {
  specs: {
    success: true,
    input: { vin: "2C3CDXFG1FH762860" },
    attributes: {
      year: "2015",
      make: "Dodge",
      model: "Charger",
      trim: "SXT",
      style: "SEDAN 4-DR",
      type: "Sedan/Saloon",
      made_in: "CANADA",
      doors: "4",
      fuel_type: "Gasoline",
      city_mileage: "19",
      highway_mileage: "31",
      engine: "3.6L V6 DOHC 24V",
      engine_cylinders: "6",
      transmission: "8-Speed Automatic",
      drivetrain: "RWD",
      standard_seating: "5",
      manufacturer_suggested_retail_price: "31900",
    },
    colors: [{ category: "Exterior", name: "Granite Metallic" }],
    equipment: { abs_brakes: "Std." },
    warranties: [{ type: "Basic", miles: "36,000 mile", months: "36 month" }],
  },
  marketValue: {
    input: { vin: "2C3CDXFG1FH762860", state: "OR" },
    model_year: "2015",
    make: "Dodge",
    model: "Charger",
    series: "SXT",
    msrp: 31900,
    ...moneyBands({ whole: 8200, retail: 11400, trade: 7100 }),
  },
  history: {
    success: true,
    vin: "2C3CDXFG1FH762860",
    junkAndSalvageInformation: [
      {
        ReportingEntityAbstract: {
          ReportingEntityCategoryText: "Junk and Salvage",
          EntityName: "Regional Salvage Yard",
          LocationCityName: "Columbus",
          LocationStateUSPostalServiceCode: "OH",
        },
        VehicleObtainedDate: "2018-04-12T00:00:00.000Z",
        VehicleDispositionText: "REBUILT",
        VehicleIntendedForExportCode: "N",
      },
    ],
    insuranceInformation: [],
    brandsRecordCount: 2,
    brandsInformation: [
      { name: "Salvage", code: "50", description: "Vehicle branded salvage" },
      { name: "Rebuilt", code: "08", description: "Vehicle rebuilt after salvage" },
    ],
    vinChanged: false,
    currentTitleInformation: [
      {
        TitleIssuingAuthorityName: "OH",
        TitleIssueDate: { Date: "2019-01-22T00:00:00.000Z" },
        VehicleOdometerReadingMeasure: "000067800",
        VehicleOdometerReadingUnitCode: "M",
      },
    ],
    historyInformation: [],
  },
  recalls: {
    success: true,
    data: { vin: "2C3CDXFG1FH762860", manufacturer: "FCA US LLC", model_year: "2015", recalls: [] },
  },
  lienTheft: {
    success: true,
    year: 2015,
    make: "DODGE",
    model: "Charger",
    type: "CAR",
    events: [
      {
        event: "Recovered Theft",
        location: "OH",
        details_list: ["The vehicle is reported to be a recovered theft."],
      },
    ],
  },
  images: imageSet("2015", "Dodge", "Charger"),
};

const BMW5: FixturePack = {
  specs: {
    success: true,
    input: { vin: "WBAFR7C57CC811956" },
    attributes: {
      year: "2012",
      make: "BMW",
      model: "5-Series",
      trim: "535i",
      style: "SEDAN 4-DR",
      type: "Sedan/Saloon",
      made_in: "GERMANY",
      doors: "4",
      fuel_type: "Gasoline",
      engine: "3.0L L6 DOHC 24V",
      engine_cylinders: "6",
      transmission: "6-Speed Manual | 8-Speed Automatic",
      drivetrain: "RWD",
      city_mileage: "19",
      highway_mileage: "28",
      standard_seating: "5",
      manufacturer_suggested_retail_price: "53200",
    },
    colors: [
      { category: "Interior", name: "Black Dakota Leather Interior" },
      { category: "Exterior", name: "Alpine White" },
    ],
    equipment: { abs_brakes: "Std.", air_conditioning: "Std." },
    warranties: [{ type: "Basic", miles: "50,000 mile", months: "48 month" }],
  },
  marketValue: {
    input: { vin: "WBAFR7C57CC811956", state: "CA" },
    model_year: "2012",
    make: "BMW",
    model: "5-Series",
    series: "535i",
    msrp: 53200,
    ...moneyBands({ whole: 6200, retail: 9800, trade: 5400 }),
  },
  history: {
    success: true,
    vin: "WBAFR7C57CC811956",
    junkAndSalvageInformation: [
      {
        ReportingEntityAbstract: {
          ReportingEntityCategoryText: "Junk and Salvage",
          EntityName: "Regional Auction",
          LocationCityName: "Dallas",
          LocationStateUSPostalServiceCode: "TX",
        },
        VehicleObtainedDate: "2016-12-06T00:00:00.000Z",
        VehicleDispositionText: "TO BE DETERMINED",
        VehicleIntendedForExportCode: "N",
      },
    ],
    insuranceInformation: [],
    brandsRecordCount: 2,
    brandsInformation: [{ name: "Salvage", code: "50", description: "Vehicle branded salvage" }],
    vinChanged: false,
    currentTitleInformation: [
      {
        TitleIssuingAuthorityName: "CA",
        TitleIssueDate: { Date: "2015-06-11T00:00:00.000Z" },
        VehicleOdometerReadingMeasure: "000024806",
        VehicleOdometerReadingUnitCode: "M",
      },
    ],
    historyInformation: [
      {
        VehicleIdentification: { IdentificationID: "WBAFR7C57CC811956" },
        TitleIssuingAuthorityName: "CA",
        TitleIssueDate: { Date: "2015-04-16T00:00:00.000Z" },
        VehicleOdometerReadingMeasure: "000024806",
        VehicleOdometerReadingUnitCode: "M",
      },
    ],
    lienTheft: {
      success: true,
      year: 2012,
      make: "BMW",
      model: "535i",
      type: "CAR",
      events: [
        {
          date: "07/01/2015",
          event: "Open Lien",
          location: "CA",
          details_list: ["Vehicle is reported to have an open lien on title: Example Bank"],
        },
      ],
    },
  },
  recalls: {
    success: true,
    data: {
      vin: "WBAFR7C57CC811956",
      manufacturer: "BMW",
      model_year: "2012",
      recalls: [
        {
          NHTSACampaignNumber: "17V-010",
          Component: "AIR BAGS",
          Summary: "Driver air bag inflator may rupture.",
          Consequence: "Metal fragments can strike the driver.",
          Remedy: "Dealers will replace the inflator.",
          ReportReceivedDate: "2017-01-10",
        },
      ],
    },
  },
  lienTheft: {
    success: true,
    year: 2012,
    make: "BMW",
    model: "535i",
    type: "CAR",
    events: [
      {
        date: "07/01/2015",
        event: "Open Lien",
        location: "CA",
        details_list: ["Vehicle is reported to have an open lien on title: Example Bank"],
      },
    ],
  },
  images: imageSet("2012", "BMW", "5-Series"),
};

const ACCORD: FixturePack = {
  specs: {
    success: true,
    input: { vin: "1HGCV1F34JA200145" },
    attributes: {
      year: "2018",
      make: "Honda",
      model: "Accord",
      trim: "EX-L",
      style: "SEDAN 4-DR",
      type: "Sedan/Saloon",
      made_in: "UNITED STATES",
      doors: "4",
      fuel_type: "Gasoline",
      city_mileage: "30",
      highway_mileage: "38",
      engine: "1.5L I4 DOHC 16V Turbo",
      engine_cylinders: "4",
      transmission: "CVT",
      drivetrain: "FWD",
      standard_seating: "5",
      manufacturer_suggested_retail_price: "30200",
    },
    colors: [{ category: "Exterior", name: "Lunar Silver Metallic" }],
    equipment: { leather_seats: "Std.", sunroof: "Std." },
    warranties: [{ type: "Basic", miles: "36,000 mile", months: "36 month" }],
  },
  marketValue: {
    input: { vin: "1HGCV1F34JA200145", state: "OR" },
    model_year: "2018",
    make: "Honda",
    model: "Accord",
    series: "EX-L",
    msrp: 30200,
    ...moneyBands({ whole: 14200, retail: 17600, trade: 12900 }),
  },
  history: {
    success: true,
    vin: "1HGCV1F34JA200145",
    junkAndSalvageInformation: [],
    insuranceInformation: [],
    brandsRecordCount: 0,
    brandsInformation: [],
    vinChanged: false,
    currentTitleInformation: [
      {
        TitleIssuingAuthorityName: "OR",
        TitleIssueDate: { Date: "2020-07-18T00:00:00.000Z" },
        VehicleOdometerReadingMeasure: "000029100",
        VehicleOdometerReadingUnitCode: "M",
      },
    ],
    historyInformation: [],
  },
  recalls: {
    success: true,
    data: { vin: "1HGCV1F34JA200145", manufacturer: "HONDA", model_year: "2018", recalls: [] },
  },
  lienTheft: { success: false, message: "No lien or theft data found for this VIN" },
  images: imageSet("2018", "Honda", "Accord"),
};

const RAV4: FixturePack = {
  specs: {
    success: true,
    input: { vin: "2T3P1RFV5MW167890" },
    attributes: {
      year: "2021",
      make: "Toyota",
      model: "RAV4",
      trim: "XLE",
      style: "SPORT UTILITY 4-DR",
      type: "Sport Utility Vehicle (SUV)/Multi-Purpose Vehicle (MPV)",
      made_in: "CANADA",
      doors: "4",
      fuel_type: "Gasoline",
      city_mileage: "27",
      highway_mileage: "35",
      engine: "2.5L I4 DOHC 16V",
      engine_cylinders: "4",
      transmission: "8-Speed Automatic",
      drivetrain: "AWD",
      standard_seating: "5",
      manufacturer_suggested_retail_price: "29750",
    },
    colors: [{ category: "Exterior", name: "Magnetic Gray Metallic" }],
    equipment: { awd: "Std.", backup_camera: "Std." },
    warranties: [{ type: "Basic", miles: "36,000 mile", months: "36 month" }],
  },
  marketValue: {
    input: { vin: "2T3P1RFV5MW167890", state: "OR" },
    model_year: "2021",
    make: "Toyota",
    model: "RAV4",
    series: "XLE",
    msrp: 29750,
    ...moneyBands({ whole: 22600, retail: 26100, trade: 20900 }),
  },
  history: {
    success: true,
    vin: "2T3P1RFV5MW167890",
    junkAndSalvageInformation: [],
    insuranceInformation: [],
    brandsRecordCount: 0,
    brandsInformation: [],
    vinChanged: false,
    currentTitleInformation: [
      {
        TitleIssuingAuthorityName: "OR",
        TitleIssueDate: { Date: "2022-09-03T00:00:00.000Z" },
        VehicleOdometerReadingMeasure: "000021550",
        VehicleOdometerReadingUnitCode: "M",
      },
    ],
    historyInformation: [],
  },
  recalls: {
    success: true,
    data: { vin: "2T3P1RFV5MW167890", manufacturer: "TOYOTA", model_year: "2021", recalls: [] },
  },
  lienTheft: { success: false, message: "No lien or theft data found for this VIN" },
  images: imageSet("2021", "Toyota", "RAV4"),
};

export const FIXTURES: Record<string, FixturePack> = {
  "4T1G11AK1NU012345": CAMRY,
  "2HKRW2H59MH123456": CRV,
  "1FTEW1E49KFA77821": F150,
  WBA5R1C50LAF22331: BMW3,
  "1GNSCGKC0JR318026": SUBURBAN,
  "1C4JJXR64PW696340": WRANGLER,
  "3KPFK4A78HE103497": FORTE,
  "2C3CDXFG1FH762860": CHARGER,
  WBAFR7C57CC811956: BMW5,
  "1HGCV1F34JA200145": ACCORD,
  "2T3P1RFV5MW167890": RAV4,
};

export const PLATE_FIXTURES: Record<string, UsPlateDecoderResponse> = {
  "H37SFS:NJ": {
    success: true,
    input: { plate: "H37SFS", state: "NJ" },
    vin: "1GNSCGKC0JR318026",
    year: "2018",
    make: "Chevrolet",
    model: "Suburban",
    trim: "LS",
    description: "2018 Chevrolet Suburban",
    engine_size: "5.3L V8 OHV 16V",
    body_style: "SUV",
    transmission: "Automatic",
    drive_type: "RWD",
    fuel_type: "Flexible-Fuel",
    color: "Black",
  },
};

export function getFixtureVin(vin: string): FixturePack | null {
  return FIXTURES[vin.toUpperCase()] ?? null;
}

export function defaultFixture(): FixturePack {
  return CAMRY;
}

export function getPlateFixture(plate: string, state: string): UsPlateDecoderResponse | null {
  return PLATE_FIXTURES[`${plate.toUpperCase()}:${state.toUpperCase()}`] ?? null;
}

export function internationalFixture(vin: string): InternationalVinResponse {
  const pack = getFixtureVin(vin) ?? defaultFixture();
  return {
    success: true,
    input: { vin },
    attributes: {
      vin,
      make: pack.specs.attributes?.make,
      model: pack.specs.attributes?.model,
      year: pack.specs.attributes?.year,
    },
  };
}
