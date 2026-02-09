import { describe, expect, it } from "vitest";

import { normalizeVehicleInput, validateVehicleInput } from "@/lib/vehicles/validation";

const baseValues = {
  branchId: "branch-1",
  registrationNumber: "abc-123",
  make: "",
  model: "",
  year: "",
  color: "",
  vin: "vin123",
  fuelType: "",
  odometer: "1200",
  status: "ACTIVE" as const,
  notes: "",
};

describe("validateVehicleInput", () => {
  it("requires required fields", () => {
    const errors = validateVehicleInput({
      branchId: "",
      registrationNumber: "",
      make: "",
      model: "",
      year: "",
      color: "",
      vin: "",
      fuelType: "",
      odometer: "",
      status: "" as never,
      notes: "",
    });

    expect(errors.branchId).toBeDefined();
    expect(errors.registrationNumber).toBeDefined();
    expect(errors.odometer).toBeDefined();
    expect(errors.status).toBeDefined();
  });

  it("normalizes registration and vin", () => {
    const normalized = normalizeVehicleInput(baseValues);
    expect(normalized.registrationNumber).toBe("ABC-123");
    expect(normalized.vin).toBe("VIN123");
  });
});
