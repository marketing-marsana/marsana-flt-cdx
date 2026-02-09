import AccessDenied from "@/components/AccessDenied";
import { SummaryCard } from "@/components/reports/SummaryCards";
import { fetchMetrics } from "@/lib/reports/metrics";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "SAR" }).format(value);
}

export default async function ProfitReportPage({
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
    .eq("module", "reports")
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
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-12">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Reports</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Profit Report</h1>
        <p className="mt-2 text-sm text-slate-600">Revenue minus operational cost.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard label="Revenue" value={formatCurrency(metrics.revenueSummary.totalFare)} />
        <SummaryCard
          label="Operational Cost"
          value={formatCurrency(metrics.costSummary.totalOperationalCost)}
        />
        <SummaryCard label="Profit" value={formatCurrency(metrics.profitability.profit)} />
        <SummaryCard
          label="Profit per Trip"
          value={formatCurrency(metrics.profitability.profitPerTrip)}
        />
        <SummaryCard
          label="Profit per Vehicle"
          value={formatCurrency(metrics.profitability.profitPerVehicle)}
        />
      </section>
    </main>
  );
}
