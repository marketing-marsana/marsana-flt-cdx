import { describe, expect, it } from "vitest";

import { calculateTotalAmount, normalizeFuelInput, validateFuelInput } from "@/lib/fuel/validation";

const baseValues = {
  branchId: "branch-1",
  vehicleId: "vehicle-1",
  tripId: "",
  filledAt: "2026-02-08T10:00",
  quantityLiters: "10",
  pricePerLiter: "5",
  totalAmount: "50",
  odometer: "1000",
  fuelStation: "Station",
  notes: "",
};

describe("validateFuelInput", () => {
  it("requires required fields", () => {
    const errors = validateFuelInput({
      branchId: "",
      vehicleId: "",
      tripId: "",
      filledAt: "",
      quantityLiters: "",
      pricePerLiter: "",
      totalAmount: "",
      odometer: "",
      fuelStation: "",
      notes: "",
    });

    expect(errors.branchId).toBeDefined();
    expect(errors.vehicleId).toBeDefined();
    expect(errors.filledAt).toBeDefined();
    expect(errors.quantityLiters).toBeDefined();
    expect(errors.pricePerLiter).toBeDefined();
    expect(errors.totalAmount).toBeDefined();
    expect(errors.odometer).toBeDefined();
  });

  it("normalizes inputs", () => {
    const normalized = normalizeFuelInput(baseValues);
    expect(normalized.vehicleId).toBe("vehicle-1");
  });

  it("requires total match", () => {
    const errors = validateFuelInput({ ...baseValues, totalAmount: "40" });
    expect(errors.totalAmount).toBeDefined();
  });
});

describe("calculateTotalAmount", () => {
  it("calculates total to 2 decimals", () => {
    expect(calculateTotalAmount("10.5", "5.25")).toBeCloseTo(55.13, 2);
  });
});
