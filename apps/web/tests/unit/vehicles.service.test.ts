import { describe, expect, it, vi } from "vitest";

import { createVehicle, deleteVehicle, updateVehicle } from "@/lib/vehicles/service";
import { VehicleFormValues, VehicleRecord } from "@/lib/vehicles/types";

const baseValues: VehicleFormValues = {
  branchId: "branch-1",
  registrationNumber: "ABC-123",
  make: "Toyota",
  model: "Camry",
  year: "2022",
  color: "White",
  vin: "VIN123",
  fuelType: "Gasoline",
  odometer: "1200",
  status: "ACTIVE",
  notes: "",
};

function createMockRepo(overrides = {}) {
  const vehicle: VehicleRecord = {
    id: "vehicle-1",
    branch_id: "branch-1",
    registration_number: "ABC-123",
    make: "Toyota",
    model: "Camry",
    year: 2022,
    color: "White",
    vin: "VIN123",
    fuel_type: "Gasoline",
    odometer: 1200,
    status: "ACTIVE",
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
    findVehicleById: vi.fn().mockResolvedValue(vehicle),
    findVehicleByRegistration: vi.fn().mockResolvedValue(null),
    findVehicleByVin: vi.fn().mockResolvedValue(null),
    insertVehicle: vi.fn().mockResolvedValue(vehicle),
    updateVehicle: vi.fn().mockResolvedValue({ ...vehicle, status: "MAINTENANCE", odometer: 1300 }),
    softDeleteVehicle: vi.fn().mockResolvedValue(undefined),
    insertAuditLog: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("vehicle service", () => {
  it("creates vehicle with audit log", async () => {
    const repo = createMockRepo();
    const result = await createVehicle(repo, "admin-1", baseValues);

    expect(result.success).toBe(true);
    expect(repo.insertVehicle).toHaveBeenCalled();
    expect(repo.insertAuditLog).toHaveBeenCalled();
  });

  it("blocks odometer decrease", async () => {
    const repo = createMockRepo();
    const result = await updateVehicle(repo, "admin-1", "vehicle-1", {
      ...baseValues,
      odometer: "1000",
    });

    expect(result.fieldErrors?.odometer).toBeDefined();
  });

  it("soft deletes vehicle", async () => {
    const repo = createMockRepo();
    const result = await deleteVehicle(repo, "admin-1", "vehicle-1");

    expect(result.success).toBe(true);
    expect(repo.softDeleteVehicle).toHaveBeenCalled();
  });
});
