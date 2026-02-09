import AccessDenied from "@/components/AccessDenied";
import { RevenueCostChart } from "@/components/reports/Charts";
import { SummaryCard } from "@/components/reports/SummaryCards";
import { fetchMetrics } from "@/lib/reports/metrics";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "SAR" }).format(value);
}

export default async function OverviewDashboard({
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

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-12">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Overview</h1>
        <p className="mt-2 text-sm text-slate-600">Revenue and profitability snapshot.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Trips" value={metrics.revenueSummary.totalTrips.toString()} />
        <SummaryCard label="Revenue" value={formatCurrency(metrics.revenueSummary.totalFare)} />
        <SummaryCard
          label="Operational Cost"
          value={formatCurrency(metrics.costSummary.totalOperationalCost)}
        />
        <SummaryCard label="Profit" value={formatCurrency(metrics.profitability.profit)} />
      </section>

      <RevenueCostChart data={metrics.monthlyTrends} />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Avg Fare" value={formatCurrency(metrics.revenueSummary.averageFare)} />
        <SummaryCard
          label="Profit per Trip"
          value={formatCurrency(metrics.profitability.profitPerTrip)}
        />
        <SummaryCard
          label="Profit per Vehicle"
          value={formatCurrency(metrics.profitability.profitPerVehicle)}
        />
        <SummaryCard
          label="Fuel Efficiency"
          value={`${metrics.efficiency.fuelEfficiency.toFixed(2)} km/L`}
        />
      </section>
    </main>
  );
}
