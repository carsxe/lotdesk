import { describe, expect, it } from "vitest";
import { planFromPrompt } from "./ai";
import { parseIncentiveCsv, matchIncentives } from "./incentive";
import { parseSourceCsv, scoreSourcingCandidate } from "./source";

describe("source adapter", () => {
  it("parses a CSV feed and scores against Turn Score", () => {
    const rows = parseSourceCsv(`vin,year,make,model,trim,mileage,asking,source
1HGCV1F34JA200145,2018,Honda,Accord,EX-L,41200,14200,Lane 12
2T3P1RFV5MW167890,2021,Toyota,RAV4,XLE,28750,26800,Marketplace`);
    expect(rows).toHaveLength(2);
    expect(rows[0].askingCents).toBe(14200_00);

    const buy = scoreSourcingCandidate({
      askingCents: 14200_00,
      marketRetailCents: 17600_00,
      marketWholesaleCents: 14200_00,
      binNeed: 1,
    });
    expect(buy.fit).not.toBe("pass");

    const skip = scoreSourcingCandidate({
      askingCents: 26800_00,
      marketRetailCents: 26100_00,
      marketWholesaleCents: 22600_00,
      binNeed: -1,
    });
    expect(skip.recommendation).toBe("DONT_BUY");
  });
});

describe("incentive adapter", () => {
  it("imports dealer programs and matches new units", () => {
    const programs = parseIncentiveCsv(`name,make,model,year,amount,kind
College grad,Toyota,Camry,2025,500,REBATE
Apr special,Honda,,2025,0,APR`);
    expect(programs[0].amountCents).toBe(500_00);
    const hits = matchIncentives(programs, { make: "Toyota", model: "Camry", year: 2025 });
    expect(hits).toHaveLength(1);
    expect(hits[0].name).toBe("College grad");
  });
});

describe("assistant planner", () => {
  const context = { agedCount: 2, needPhotos: 3, pendingRecon: 4, overMarket: 1 };

  it("plans a 60+ day reprice", () => {
    const plan = planFromPrompt("reprice my 60+ day units to market", context);
    expect(plan.action).toEqual({ type: "reprice_aged", minDays: 60 });
  });

  it("lists units that need photos", () => {
    const plan = planFromPrompt("which units need photos", context);
    expect(plan.action.type).toBe("list_need_photos");
    expect(plan.reply).toContain("3");
  });
});
