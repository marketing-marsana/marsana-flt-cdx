import { describe, expect, it } from "vitest";

import { isValidTransition, normalizeTripInput, validateTripInput } from "@/lib/trips/validation";

const baseValues = {
  branchId: "branch-1",
  driverId: "driver-1",
  vehicleId: "vehicle-1",
  tripCode: "trip-001",
  customerName: "Customer",
  customerPhone: "0500000000",
  pickupLocation: "Pickup",
  dropoffLocation: "Dropoff",
  scheduledStartAt: "2026-02-08T10:00",
  scheduledEndAt: "2026-02-08T12:00",
  actualStartAt: "",
  actualEndAt: "",
  distanceKm: "12",
  fareAmount: "100",
  status: "SCHEDULED" as const,
  notes: "",
};

describe("validateTripInput", () => {
  it("requires required fields", () => {
    const errors = validateTripInput({
      branchId: "",
      driverId: "",
      vehicleId: "",
      tripCode: "",
      customerName: "",
      customerPhone: "",
      pickupLocation: "",
      dropoffLocation: "",
      scheduledStartAt: "",
      scheduledEndAt: "",
      actualStartAt: "",
      actualEndAt: "",
      distanceKm: "",
      fareAmount: "",
      status: "" as never,
      notes: "",
    });

    expect(errors.branchId).toBeDefined();
    expect(errors.driverId).toBeDefined();
    expect(errors.vehicleId).toBeDefined();
    expect(errors.tripCode).toBeDefined();
    expect(errors.pickupLocation).toBeDefined();
    expect(errors.dropoffLocation).toBeDefined();
    expect(errors.scheduledStartAt).toBeDefined();
    expect(errors.status).toBeDefined();
  });

  it("normalizes trip code to uppercase", () => {
    const normalized = normalizeTripInput(baseValues);
    expect(normalized.tripCode).toBe("TRIP-001");
  });

  it("rejects negative fare or distance", () => {
    const errors = validateTripInput({
      ...baseValues,
      distanceKm: "-2",
      fareAmount: "-1",
    });

    expect(errors.distanceKm).toBeDefined();
    expect(errors.fareAmount).toBeDefined();
  });

  it("requires scheduled end after start", () => {
    const errors = validateTripInput({
      ...baseValues,
      scheduledEndAt: "2026-02-08T09:00",
    });

    expect(errors.scheduledEndAt).toBeDefined();
  });
});

describe("isValidTransition", () => {
  it("allows scheduled to in progress", () => {
    expect(isValidTransition("SCHEDULED", "IN_PROGRESS")).toBe(true);
  });

  it("blocks scheduled to completed", () => {
    expect(isValidTransition("SCHEDULED", "COMPLETED")).toBe(false);
  });
});
