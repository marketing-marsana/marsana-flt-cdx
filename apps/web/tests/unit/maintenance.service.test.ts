import { describe, expect, it, vi } from "vitest";

import { createMaintenance, updateMaintenance } from "@/lib/maintenance/service";
import { MaintenanceFormValues, MaintenanceRecord } from "@/lib/maintenance/types";

const baseValues: MaintenanceFormValues = {
  branchId: "branch-1",
  vehicleId: "vehicle-1",
  tripId: "",
  serviceDate: "2026-02-08T10:00:00.000Z",
  maintenanceType: "service",
  description: "Oil change",
  vendorOrWorkshop: "Workshop",
  costAmount: "150",
  odometer: "1000",
  nextServiceOdometer: "1200",
  nextServiceDate: "2026-03-01",
  notes: "",
};

function createMockRepo(overrides = {}) {
  const maintenance: MaintenanceRecord = {
    id: "maint-1",
    branch_id: "branch-1",
    vehicle_id: "vehicle-1",
    trip_id: null,
    service_date: "2026-02-08T10:00:00.000Z",
    maintenance_type: "service",
    description: "Oil change",
    vendor_or_workshop: "Workshop",
    cost_amount: 150,
    odometer: 1000,
    next_service_odometer: 1200,
    next_service_date: "2026-03-01T00:00:00.000Z",
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
    findMaintenanceById: vi.fn().mockResolvedValue(maintenance),
    getVehicle: vi.fn().mockResolvedValue({ id: "vehicle-1", branch_id: "branch-1" }),
    getTrip: vi.fn().mockResolvedValue(null),
    getLatestMaintenanceOdometer: vi.fn().mockResolvedValue({ odometer: 900 }),
    getLatestFuelOdometer: vi.fn().mockResolvedValue({ odometer: 950 }),
    insertMaintenance: vi.fn().mockResolvedValue(maintenance),
    updateMaintenance: vi.fn().mockResolvedValue({ ...maintenance, odometer: 1100 }),
    softDeleteMaintenance: vi.fn().mockResolvedValue(undefined),
    insertAuditLog: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("maintenance service", () => {
  it("creates maintenance log with audit log", async () => {
    const repo = createMockRepo();
    const result = await createMaintenance(repo, "admin-1", baseValues);

    expect(result.success).toBe(true);
    expect(repo.insertMaintenance).toHaveBeenCalled();
    expect(repo.insertAuditLog).toHaveBeenCalled();
  });

  it("blocks odometer decrease vs fuel/maintenance", async () => {
    const repo = createMockRepo({
      getLatestFuelOdometer: vi.fn().mockResolvedValue({ odometer: 1200 }),
    });
    const result = await createMaintenance(repo, "admin-1", baseValues);

    expect(result.error).toContain("Odometer");
  });

  it("blocks invalid trip vehicle mapping", async () => {
    const repo = createMockRepo({
      getTrip: vi
        .fn()
        .mockResolvedValue({ id: "trip-1", branch_id: "branch-1", vehicle_id: "vehicle-x" }),
    });
    const result = await createMaintenance(repo, "admin-1", { ...baseValues, tripId: "trip-1" });
    expect(result.error).toContain("Trip must match the selected vehicle");
  });

  it("updates maintenance log", async () => {
    const repo = createMockRepo();
    const result = await updateMaintenance(repo, "admin-1", "maint-1", baseValues);
    expect(result.success).toBe(true);
  });
});
