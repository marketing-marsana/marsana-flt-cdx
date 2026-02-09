import { describe, expect, it, vi } from "vitest";

import { createTrip, updateTrip } from "@/lib/trips/service";
import { TripFormValues, TripRecord } from "@/lib/trips/types";

const baseValues: TripFormValues = {
  branchId: "branch-1",
  driverId: "driver-1",
  vehicleId: "vehicle-1",
  tripCode: "TRIP-100",
  customerName: "Customer",
  customerPhone: "0500000000",
  pickupLocation: "Pickup",
  dropoffLocation: "Dropoff",
  scheduledStartAt: "2026-02-08T10:00:00.000Z",
  scheduledEndAt: "2026-02-08T12:00:00.000Z",
  actualStartAt: "",
  actualEndAt: "",
  distanceKm: "12",
  fareAmount: "100",
  status: "SCHEDULED",
  notes: "",
};

function createMockRepo(overrides = {}) {
  const trip: TripRecord = {
    id: "trip-1",
    branch_id: "branch-1",
    driver_id: "driver-1",
    vehicle_id: "vehicle-1",
    trip_code: "TRIP-100",
    customer_name: "Customer",
    customer_phone: "0500000000",
    pickup_location: "Pickup",
    dropoff_location: "Dropoff",
    scheduled_start_at: "2026-02-08T10:00:00.000Z",
    scheduled_end_at: "2026-02-08T12:00:00.000Z",
    actual_start_at: null,
    actual_end_at: null,
    distance_km: 12,
    fare_amount: 100,
    status: "SCHEDULED",
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
    findTripById: vi.fn().mockResolvedValue(trip),
    findTripByCode: vi.fn().mockResolvedValue(null),
    getDriver: vi.fn().mockResolvedValue({ id: "driver-1", branch_id: "branch-1" }),
    getVehicle: vi.fn().mockResolvedValue({ id: "vehicle-1", branch_id: "branch-1" }),
    findOverlappingTrips: vi.fn().mockResolvedValue([]),
    insertTrip: vi.fn().mockResolvedValue(trip),
    updateTrip: vi.fn().mockResolvedValue({ ...trip, status: "IN_PROGRESS" }),
    softDeleteTrip: vi.fn().mockResolvedValue(undefined),
    insertAuditLog: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("trip service", () => {
  it("creates trip with audit log", async () => {
    const repo = createMockRepo();
    const result = await createTrip(repo, "admin-1", baseValues);

    expect(result.success).toBe(true);
    expect(repo.insertTrip).toHaveBeenCalled();
    expect(repo.insertAuditLog).toHaveBeenCalled();
  });

  it("blocks overlapping trips", async () => {
    const repo = createMockRepo({
      findOverlappingTrips: vi.fn().mockResolvedValue([
        {
          id: "trip-2",
          driver_id: "driver-1",
          vehicle_id: "vehicle-2",
          scheduled_start_at: "2026-02-08T09:30:00.000Z",
          scheduled_end_at: "2026-02-08T11:30:00.000Z",
          status: "SCHEDULED",
        },
      ]),
    });

    const result = await createTrip(repo, "admin-1", baseValues);
    expect(result.error).toContain("overlapping");
  });

  it("rejects invalid status transitions", async () => {
    const trip: TripRecord = {
      id: "trip-1",
      branch_id: "branch-1",
      driver_id: "driver-1",
      vehicle_id: "vehicle-1",
      trip_code: "TRIP-100",
      customer_name: "Customer",
      customer_phone: "0500000000",
      pickup_location: "Pickup",
      dropoff_location: "Dropoff",
      scheduled_start_at: "2026-02-08T10:00:00.000Z",
      scheduled_end_at: "2026-02-08T12:00:00.000Z",
      actual_start_at: null,
      actual_end_at: null,
      distance_km: 12,
      fare_amount: 100,
      status: "SCHEDULED",
      notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    };
    const repo = createMockRepo({
      findTripById: vi.fn().mockResolvedValue(trip),
    });

    const result = await updateTrip(repo, "admin-1", "trip-1", {
      ...baseValues,
      status: "COMPLETED",
    });
    expect(result.error).toContain("Invalid status transition");
  });
});
