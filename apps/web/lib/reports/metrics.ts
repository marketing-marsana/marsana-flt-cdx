import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  computeEfficiencySummary,
  computeMonthlyTrends,
  computeOperationalCostSummary,
  computeProfitabilitySummary,
  computeTripRevenueSummary,
  type ExpenseRow,
  type FuelRow,
  type MaintenanceRow,
  type MonthlyTrendPoint,
  type TripRow,
} from "@/lib/reports/compute";

export type { MonthlyTrendPoint } from "@/lib/reports/compute";

export type MetricsFilters = {
  startDate?: string;
  endDate?: string;
  branchId?: string;
  vehicleId?: string;
};

export type MetricsBundle = {
  revenueSummary: ReturnType<typeof computeTripRevenueSummary>;
  costSummary: ReturnType<typeof computeOperationalCostSummary>;
  profitability: ReturnType<typeof computeProfitabilitySummary>;
  efficiency: ReturnType<typeof computeEfficiencySummary>;
  monthlyTrends: MonthlyTrendPoint[];
  trips: TripRow[];
  fuelLogs: FuelRow[];
  maintenanceLogs: MaintenanceRow[];
  expenseLogs: ExpenseRow[];
};

type DateRangeQuery<T> = {
  gte: (column: string, value: string) => T;
  lte: (column: string, value: string) => T;
};

function applyDateRange<T extends DateRangeQuery<T>>(
  query: T,
  column: string,
  filters: MetricsFilters,
): T {
  if (filters.startDate) {
    query = query.gte(column, `${filters.startDate}T00:00:00`);
  }
  if (filters.endDate) {
    query = query.lte(column, `${filters.endDate}T23:59:59`);
  }
  return query;
}

export async function fetchMetrics(filters: MetricsFilters): Promise<MetricsBundle> {
  const supabase = createSupabaseServerClient();

  let tripQuery = supabase
    .from("trips")
    .select(
      "id, branch_id, vehicle_id, driver_id, distance_km, fare_amount, status, scheduled_start_at",
    )
    .is("deleted_at", null)
    .neq("status", "CANCELLED");

  let fuelQuery = supabase
    .from("fuel_logs")
    .select("branch_id, vehicle_id, quantity_liters, total_amount, filled_at")
    .is("deleted_at", null);

  let maintenanceQuery = supabase
    .from("maintenance_logs")
    .select("branch_id, vehicle_id, cost_amount, service_date")
    .is("deleted_at", null);

  let expenseQuery = supabase
    .from("expense_logs")
    .select("branch_id, related_vehicle_id, amount, expense_date, category")
    .is("deleted_at", null);

  if (filters.branchId) {
    tripQuery = tripQuery.eq("branch_id", filters.branchId);
    fuelQuery = fuelQuery.eq("branch_id", filters.branchId);
    maintenanceQuery = maintenanceQuery.eq("branch_id", filters.branchId);
    expenseQuery = expenseQuery.eq("branch_id", filters.branchId);
  }

  if (filters.vehicleId) {
    tripQuery = tripQuery.eq("vehicle_id", filters.vehicleId);
    fuelQuery = fuelQuery.eq("vehicle_id", filters.vehicleId);
    maintenanceQuery = maintenanceQuery.eq("vehicle_id", filters.vehicleId);
    expenseQuery = expenseQuery.eq("related_vehicle_id", filters.vehicleId);
  }

  tripQuery = applyDateRange(tripQuery, "scheduled_start_at", filters);
  fuelQuery = applyDateRange(fuelQuery, "filled_at", filters);
  maintenanceQuery = applyDateRange(maintenanceQuery, "service_date", filters);
  expenseQuery = applyDateRange(expenseQuery, "expense_date", filters);

  const [tripResult, fuelResult, maintenanceResult, expenseResult] = await Promise.all([
    tripQuery,
    fuelQuery,
    maintenanceQuery,
    expenseQuery,
  ]);

  if (tripResult.error) {
    throw tripResult.error;
  }
  if (fuelResult.error) {
    throw fuelResult.error;
  }
  if (maintenanceResult.error) {
    throw maintenanceResult.error;
  }
  if (expenseResult.error) {
    throw expenseResult.error;
  }

  const trips = (tripResult.data ?? []) as TripRow[];
  const fuelLogs = (fuelResult.data ?? []) as FuelRow[];
  const maintenanceLogs = (maintenanceResult.data ?? []) as MaintenanceRow[];
  const expenseLogs = (expenseResult.data ?? []) as ExpenseRow[];

  const revenueSummary = computeTripRevenueSummary(trips);
  const costSummary = computeOperationalCostSummary(fuelLogs, maintenanceLogs, expenseLogs);
  const uniqueVehicles = new Set(trips.map((trip) => trip.vehicle_id).filter(Boolean)).size;
  const profitability = computeProfitabilitySummary(
    revenueSummary.totalFare,
    costSummary.totalOperationalCost,
    revenueSummary.totalTrips,
    uniqueVehicles,
  );
  const efficiency = computeEfficiencySummary(trips, fuelLogs, maintenanceLogs);
  const monthlyTrends = computeMonthlyTrends(trips, fuelLogs, maintenanceLogs, expenseLogs);

  return {
    revenueSummary,
    costSummary,
    profitability,
    efficiency,
    monthlyTrends,
    trips,
    fuelLogs,
    maintenanceLogs,
    expenseLogs,
  };
}
