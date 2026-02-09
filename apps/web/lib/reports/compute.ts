export type TripRow = {
  id: string;
  branch_id: string;
  vehicle_id: string | null;
  driver_id: string | null;
  distance_km: number | null;
  fare_amount: number | null;
  status: string;
  scheduled_start_at: string;
};

export type FuelRow = {
  branch_id: string;
  vehicle_id: string;
  quantity_liters: number;
  total_amount: number;
  filled_at: string;
};

export type MaintenanceRow = {
  branch_id: string;
  vehicle_id: string;
  cost_amount: number;
  service_date: string;
};

export type ExpenseRow = {
  branch_id: string;
  related_vehicle_id: string | null;
  amount: number;
  expense_date: string;
  category: string;
};

export type TripRevenueSummary = {
  totalTrips: number;
  totalDistance: number;
  totalFare: number;
  averageFare: number;
};

export type OperationalCostSummary = {
  totalFuelCost: number;
  totalMaintenanceCost: number;
  totalOtherExpenses: number;
  totalOperationalCost: number;
};

export type ProfitabilitySummary = {
  revenue: number;
  operationalCost: number;
  profit: number;
  profitPerTrip: number;
  profitPerVehicle: number;
};

export type EfficiencySummary = {
  fuelEfficiency: number;
  maintenanceCostPerVehicle: number;
  tripsPerDriver: number;
  tripsPerVehicle: number;
};

export type MonthlyTrendPoint = {
  month: string;
  revenue: number;
  cost: number;
  fuelLiters: number;
};

function toMonthKey(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function computeTripRevenueSummary(trips: TripRow[]): TripRevenueSummary {
  const totals = trips.reduce(
    (acc, trip) => {
      acc.totalTrips += 1;
      acc.totalDistance += trip.distance_km ?? 0;
      acc.totalFare += trip.fare_amount ?? 0;
      return acc;
    },
    { totalTrips: 0, totalDistance: 0, totalFare: 0 },
  );

  return {
    totalTrips: totals.totalTrips,
    totalDistance: totals.totalDistance,
    totalFare: totals.totalFare,
    averageFare: totals.totalTrips ? totals.totalFare / totals.totalTrips : 0,
  };
}

export function computeOperationalCostSummary(
  fuelLogs: FuelRow[],
  maintenanceLogs: MaintenanceRow[],
  expenseLogs: ExpenseRow[],
): OperationalCostSummary {
  const totalFuelCost = fuelLogs.reduce((sum, log) => sum + (log.total_amount ?? 0), 0);
  const totalMaintenanceCost = maintenanceLogs.reduce(
    (sum, log) => sum + (log.cost_amount ?? 0),
    0,
  );
  const totalOtherExpenses = expenseLogs.reduce((sum, log) => sum + (log.amount ?? 0), 0);
  const totalOperationalCost = totalFuelCost + totalMaintenanceCost + totalOtherExpenses;

  return {
    totalFuelCost,
    totalMaintenanceCost,
    totalOtherExpenses,
    totalOperationalCost,
  };
}

export function computeProfitabilitySummary(
  revenue: number,
  operationalCost: number,
  tripCount: number,
  vehicleCount: number,
): ProfitabilitySummary {
  const profit = revenue - operationalCost;
  return {
    revenue,
    operationalCost,
    profit,
    profitPerTrip: tripCount ? profit / tripCount : 0,
    profitPerVehicle: vehicleCount ? profit / vehicleCount : 0,
  };
}

export function computeEfficiencySummary(
  trips: TripRow[],
  fuelLogs: FuelRow[],
  maintenanceLogs: MaintenanceRow[],
): EfficiencySummary {
  const totalDistance = trips.reduce((sum, trip) => sum + (trip.distance_km ?? 0), 0);
  const totalLiters = fuelLogs.reduce((sum, log) => sum + (log.quantity_liters ?? 0), 0);
  const fuelEfficiency = totalLiters ? totalDistance / totalLiters : 0;

  const maintenanceCost = maintenanceLogs.reduce((sum, log) => sum + (log.cost_amount ?? 0), 0);
  const maintenanceVehicleCount = new Set(maintenanceLogs.map((log) => log.vehicle_id)).size;
  const maintenanceCostPerVehicle = maintenanceVehicleCount
    ? maintenanceCost / maintenanceVehicleCount
    : 0;

  const driverCount = new Set(trips.map((trip) => trip.driver_id).filter(Boolean)).size;
  const vehicleCount = new Set(trips.map((trip) => trip.vehicle_id).filter(Boolean)).size;

  return {
    fuelEfficiency,
    maintenanceCostPerVehicle,
    tripsPerDriver: driverCount ? trips.length / driverCount : 0,
    tripsPerVehicle: vehicleCount ? trips.length / vehicleCount : 0,
  };
}

export function computeMonthlyTrends(
  trips: TripRow[],
  fuelLogs: FuelRow[],
  maintenanceLogs: MaintenanceRow[],
  expenseLogs: ExpenseRow[],
): MonthlyTrendPoint[] {
  const map = new Map<string, MonthlyTrendPoint>();
  const ensure = (month: string) => {
    if (!map.has(month)) {
      map.set(month, { month, revenue: 0, cost: 0, fuelLiters: 0 });
    }
    return map.get(month)!;
  };

  trips.forEach((trip) => {
    const month = toMonthKey(trip.scheduled_start_at);
    ensure(month).revenue += trip.fare_amount ?? 0;
  });

  fuelLogs.forEach((log) => {
    const month = toMonthKey(log.filled_at);
    const entry = ensure(month);
    entry.cost += log.total_amount ?? 0;
    entry.fuelLiters += log.quantity_liters ?? 0;
  });

  maintenanceLogs.forEach((log) => {
    const month = toMonthKey(log.service_date);
    ensure(month).cost += log.cost_amount ?? 0;
  });

  expenseLogs.forEach((log) => {
    const month = toMonthKey(log.expense_date);
    ensure(month).cost += log.amount ?? 0;
  });

  return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
}
