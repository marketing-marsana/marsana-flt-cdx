import { describe, expect, it } from "vitest";

import { normalizeMaintenanceInput, validateMaintenanceInput } from "@/lib/maintenance/validation";

const baseValues = {
  branchId: "branch-1",
  vehicleId: "vehicle-1",
  tripId: "",
  serviceDate: "2026-02-08T10:00",
  maintenanceType: "service" as const,
  description: "Oil change",
  vendorOrWorkshop: "Workshop",
  costAmount: "150",
  odometer: "1000",
  nextServiceOdometer: "1200",
  nextServiceDate: "2026-03-01",
  notes: "",
};

describe("validateMaintenanceInput", () => {
  it("requires required fields", () => {
    const errors = validateMaintenanceInput({
      branchId: "",
      vehicleId: "",
      tripId: "",
      serviceDate: "",
      maintenanceType: "" as never,
      description: "",
      vendorOrWorkshop: "",
      costAmount: "",
      odometer: "",
      nextServiceOdometer: "",
      nextServiceDate: "",
      notes: "",
    });

    expect(errors.branchId).toBeDefined();
    expect(errors.vehicleId).toBeDefined();
    expect(errors.serviceDate).toBeDefined();
    expect(errors.maintenanceType).toBeDefined();
    expect(errors.description).toBeDefined();
    expect(errors.costAmount).toBeDefined();
    expect(errors.odometer).toBeDefined();
  });

  it("normalizes inputs", () => {
    const normalized = normalizeMaintenanceInput(baseValues);
    expect(normalized.description).toBe("Oil change");
  });

  it("rejects negative cost", () => {
    const errors = validateMaintenanceInput({ ...baseValues, costAmount: "-1" });
    expect(errors.costAmount).toBeDefined();
  });
});
