import AccessDenied from "@/components/AccessDenied";
import { FuelUsageChart } from "@/components/reports/Charts";
import { SummaryCard } from "@/components/reports/SummaryCards";
import { fetchMetrics } from "@/lib/reports/metrics";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function OperationsDashboard({
  searchParams,
}: {
  searchParams?: { start?: string; end?: string; branch?: string; vehicle?: string };
}) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("is_super_admin")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) {
    return <AccessDenied />;
  }

  const { data: permission } = await supabase
    .from("user_permissions")
    .select("can_view")
    .eq("user_id", user.id)
    .eq("module", "dashboards")
    .maybeSingle();

  if (!profile.is_super_admin && !permission?.can_view) {
    return <AccessDenied />;
  }

  const metrics = await fetchMetrics({
    startDate: searchParams?.start,
    endDate: searchParams?.end,
    branchId: searchParams?.branch,
    vehicleId: searchParams?.vehicle,
  });

  const topDrivers = Array.from(
    metrics.trips.reduce((acc, trip) => {
      if (!trip.driver_id) return acc;
      acc.set(trip.driver_id, (acc.get(trip.driver_id) ?? 0) + 1);
      return acc;
    }, new Map<string, number>()),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const topVehicles = Array.from(
    metrics.trips.reduce((acc, trip) => {
      if (!trip.vehicle_id) return acc;
      acc.set(trip.vehicle_id, (acc.get(trip.vehicle_id) ?? 0) + 1);
      return acc;
    }, new Map<string, number>()),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-12">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Operations</h1>
        <p className="mt-2 text-sm text-slate-600">Trip and utilization performance.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Trips" value={metrics.revenueSummary.totalTrips.toString()} />
        <SummaryCard
          label="Trips per Driver"
          value={metrics.efficiency.tripsPerDriver.toFixed(2)}
        />
        <SummaryCard
          label="Trips per Vehicle"
          value={metrics.efficiency.tripsPerVehicle.toFixed(2)}
        />
        <SummaryCard
          label="Fuel Efficiency"
          value={`${metrics.efficiency.fuelEfficiency.toFixed(2)} km/L`}
        />
      </section>

      <FuelUsageChart data={metrics.monthlyTrends} />

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-slate-900">Top Drivers</h3>
          <p className="mt-1 text-sm text-slate-500">Trips per driver</p>
          <div className="mt-4 space-y-2">
            {topDrivers.length ? (
              topDrivers.map(([driverId, count]) => (
                <div
                  key={driverId}
                  className="flex items-center justify-between text-sm text-slate-700"
                >
                  <span>{driverId}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No driver data available.</p>
            )}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-slate-900">Top Vehicles</h3>
          <p className="mt-1 text-sm text-slate-500">Trips per vehicle</p>
          <div className="mt-4 space-y-2">
            {topVehicles.length ? (
              topVehicles.map(([vehicleId, count]) => (
                <div
                  key={vehicleId}
                  className="flex items-center justify-between text-sm text-slate-700"
                >
                  <span>{vehicleId}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No vehicle data available.</p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
