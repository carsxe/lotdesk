import { describe, expect, it } from "vitest";
import { buildStockingBoard, classifySegment } from "./stocking";

describe("stocking board", () => {
  it("flags overstocked and understocked bins", () => {
    const board = buildStockingBoard(
      [
        { id: "1", make: "Toyota", model: "Camry", segment: "Car", daysInStock: 12, status: "FRONTLINE" },
        { id: "2", make: "Toyota", model: "Camry", segment: "Car", daysInStock: 48, status: "FRONTLINE" },
        { id: "3", make: "Toyota", model: "Camry", segment: "Car", daysInStock: 9, status: "FRONTLINE" },
        { id: "4", make: "Honda", model: "CR-V", segment: "SUV", daysInStock: 6, status: "IN_RECON" },
      ],
      2,
      45,
    );
    const camry = board.find((bin) => bin.model === "Camry");
    const crv = board.find((bin) => bin.model === "CR-V");
    expect(camry?.action).toBe("OVERSTOCK");
    expect(camry?.need).toBe(-1);
    expect(camry?.agedCount).toBe(1);
    expect(crv?.action).toBe("BUY");
    expect(crv?.need).toBe(1);
  });

  it("classifies common body styles", () => {
    expect(classifySegment("Crew Cab Pickup", "F-150")).toBe("Truck");
    expect(classifySegment("Sport Utility", "CR-V")).toBe("SUV");
    expect(classifySegment("Sedan", "Camry")).toBe("Car");
  });
});
