import { describe, expect, it } from "vitest";

import {
  computeOperationalCostSummary,
  computeProfitabilitySummary,
  computeTripRevenueSummary,
} from "@/lib/reports/compute";

describe("report metrics", () => {
  it("computes trip revenue summary", () => {
    const summary = computeTripRevenueSummary([
      {
        id: "t1",
        branch_id: "b1",
        vehicle_id: "v1",
        driver_id: "d1",
        distance_km: 50,
        fare_amount: 100,
        status: "COMPLETED",
        scheduled_start_at: "2026-02-01T00:00:00Z",
      },
      {
        id: "t2",
        branch_id: "b1",
        vehicle_id: "v2",
        driver_id: "d2",
        distance_km: 30,
        fare_amount: 60,
        status: "COMPLETED",
        scheduled_start_at: "2026-02-02T00:00:00Z",
      },
    ]);

    expect(summary.totalTrips).toBe(2);
    expect(summary.totalDistance).toBe(80);
    expect(summary.totalFare).toBe(160);
    expect(summary.averageFare).toBe(80);
  });

  it("computes operational cost summary", () => {
    const summary = computeOperationalCostSummary(
      [{ branch_id: "b1", vehicle_id: "v1", quantity_liters: 10, total_amount: 50, filled_at: "" }],
      [{ branch_id: "b1", vehicle_id: "v1", cost_amount: 80, service_date: "" }],
      [
        {
          branch_id: "b1",
          related_vehicle_id: null,
          amount: 20,
          expense_date: "",
          category: "misc",
        },
      ],
    );

    expect(summary.totalFuelCost).toBe(50);
    expect(summary.totalMaintenanceCost).toBe(80);
    expect(summary.totalOtherExpenses).toBe(20);
    expect(summary.totalOperationalCost).toBe(150);
  });

  it("computes profitability summary", () => {
    const summary = computeProfitabilitySummary(200, 150, 2, 1);
    expect(summary.profit).toBe(50);
    expect(summary.profitPerTrip).toBe(25);
    expect(summary.profitPerVehicle).toBe(50);
  });
});
