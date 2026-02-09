import AccessDenied from "@/components/AccessDenied";
import { SummaryCard } from "@/components/reports/SummaryCards";
import { fetchMetrics } from "@/lib/reports/metrics";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "SAR" }).format(value);
}

export default async function CostsDashboard({
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

  const topBranches = Array.from(
    metrics.trips.reduce((acc, trip) => {
      acc.set(trip.branch_id, (acc.get(trip.branch_id) ?? 0) + (trip.fare_amount ?? 0));
      return acc;
    }, new Map<string, number>()),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-12">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Costs</h1>
        <p className="mt-2 text-sm text-slate-600">Operational expenditure overview.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Fuel Cost" value={formatCurrency(metrics.costSummary.totalFuelCost)} />
        <SummaryCard
          label="Maintenance Cost"
          value={formatCurrency(metrics.costSummary.totalMaintenanceCost)}
        />
        <SummaryCard
          label="Other Expenses"
          value={formatCurrency(metrics.costSummary.totalOtherExpenses)}
        />
        <SummaryCard
          label="Total Cost"
          value={formatCurrency(metrics.costSummary.totalOperationalCost)}
        />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900">Top Branches by Revenue</h3>
        <p className="mt-1 text-sm text-slate-500">Snapshot by trip revenue</p>
        <div className="mt-4 space-y-2">
          {topBranches.length ? (
            topBranches.map(([branchId, revenue]) => (
              <div
                key={branchId}
                className="flex items-center justify-between text-sm text-slate-700"
              >
                <span>{branchId}</span>
                <span className="font-semibold">{formatCurrency(revenue)}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No branch data available.</p>
          )}
        </div>
      </section>
    </main>
  );
}
