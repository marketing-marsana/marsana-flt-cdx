import { describe, expect, it, vi } from "vitest";

import { createFuelLog, updateFuelLog } from "@/lib/fuel/service";
import { FuelFormValues, FuelRecord } from "@/lib/fuel/types";

const baseValues: FuelFormValues = {
  branchId: "branch-1",
  vehicleId: "vehicle-1",
  tripId: "",
  filledAt: "2026-02-08T10:00:00.000Z",
  quantityLiters: "10",
  pricePerLiter: "5",
  totalAmount: "50",
  odometer: "1000",
  fuelStation: "Station",
  notes: "",
};

function createMockRepo(overrides = {}) {
  const fuelLog: FuelRecord = {
    id: "fuel-1",
    branch_id: "branch-1",
    vehicle_id: "vehicle-1",
    trip_id: null,
    filled_at: "2026-02-08T10:00:00.000Z",
    quantity_liters: 10,
    price_per_liter: 5,
    total_amount: 50,
    odometer: 1000,
    fuel_station: "Station",
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  };

  return {
    getProfile: vi.fn().mockResolvedValue({ is_super_admin: true, branch_id: "branch-1" }),
    getPermission: vi.fn().mockResolvedValue({
      can_view: true,
      can_create: true,
      can_edit: true,
      can_delete: true,
    }),
    findFuelLogById: vi.fn().mockResolvedValue(fuelLog),
    getVehicle: vi.fn().mockResolvedValue({ id: "vehicle-1", branch_id: "branch-1" }),
    getTrip: vi.fn().mockResolvedValue(null),
    getLatestOdometer: vi.fn().mockResolvedValue({ odometer: 900 }),
    insertFuelLog: vi.fn().mockResolvedValue(fuelLog),
    updateFuelLog: vi.fn().mockResolvedValue({ ...fuelLog, odometer: 1100 }),
    softDeleteFuelLog: vi.fn().mockResolvedValue(undefined),
    insertAuditLog: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("fuel service", () => {
  it("creates fuel log with audit log", async () => {
    const repo = createMockRepo();
    const result = await createFuelLog(repo, "admin-1", baseValues);

    expect(result.success).toBe(true);
    expect(repo.insertFuelLog).toHaveBeenCalled();
    expect(repo.insertAuditLog).toHaveBeenCalled();
  });

  it("blocks odometer decrease", async () => {
    const repo = createMockRepo({
      getLatestOdometer: vi.fn().mockResolvedValue({ odometer: 1200 }),
    });
    const result = await createFuelLog(repo, "admin-1", baseValues);

    expect(result.error).toContain("Odometer");
  });

  it("rejects total mismatch", async () => {
    const repo = createMockRepo();
    const result = await createFuelLog(repo, "admin-1", { ...baseValues, totalAmount: "40" });
    expect(result.fieldErrors?.totalAmount).toBeDefined();
  });

  it("blocks invalid trip vehicle mapping", async () => {
    const repo = createMockRepo({
      getTrip: vi
        .fn()
        .mockResolvedValue({ id: "trip-1", branch_id: "branch-1", vehicle_id: "vehicle-x" }),
    });
    const result = await createFuelLog(repo, "admin-1", { ...baseValues, tripId: "trip-1" });
    expect(result.error).toContain("Trip must match the selected vehicle");
  });

  it("updates fuel log", async () => {
    const repo = createMockRepo();
    const result = await updateFuelLog(repo, "admin-1", "fuel-1", baseValues);
    expect(result.success).toBe(true);
  });
});
