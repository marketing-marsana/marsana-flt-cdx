import Link from "next/link";

import AccessDenied from "@/components/AccessDenied";
import { toCsv } from "@/lib/reports/csv";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const PAGE_SIZE = 15;

function getPageParam(value: string | string[] | undefined) {
  const parsed = Number(Array.isArray(value) ? value[0] : value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function getDateParam(value: string | string[] | undefined) {
  const dateValue = Array.isArray(value) ? value[0] : value;
  if (!dateValue) {
    return "";
  }
  return /^\d{4}-\d{2}-\d{2}$/.test(dateValue) ? dateValue : "";
}

type CostRow = {
  id: string;
  type: "fuel" | "maintenance" | "expense";
  date: string;
  vehicleId: string | null;
  amount: number;
  description: string;
};

export default async function CostsReportPage({
  searchParams,
}: {
  searchParams?: {
    search?: string;
    branch?: string;
    vehicle?: string;
    start?: string;
    end?: string;
    page?: string;
  };
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

  const { data: branches } = await supabase
    .from("branches")
    .select("id, name")
    .is("deleted_at", null)
    .order("name");

  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id, registration_number")
    .is("deleted_at", null)
    .order("registration_number");

  const page = getPageParam(searchParams?.page);
  const search = (searchParams?.search ?? "").trim();
  const branch = (searchParams?.branch ?? "").trim();
  const vehicle = (searchParams?.vehicle ?? "").trim();
  const startDate = getDateParam(searchParams?.start);
  const endDate = getDateParam(searchParams?.end);

  const applyDate = <
    T extends {
      gte: (column: string, value: string) => T;
      lte: (column: string, value: string) => T;
    },
  >(
    query: T,
    column: string,
  ) => {
    if (startDate) {
      query = query.gte(column, `${startDate}T00:00:00`);
    }
    if (endDate) {
      query = query.lte(column, `${endDate}T23:59:59`);
    }
    return query;
  };

  let fuelQuery = supabase
    .from("fuel_logs")
    .select("id, vehicle_id, filled_at, total_amount, fuel_station")
    .is("deleted_at", null);
  let maintenanceQuery = supabase
    .from("maintenance_logs")
    .select("id, vehicle_id, service_date, cost_amount, description")
    .is("deleted_at", null);
  let expenseQuery = supabase
    .from("expense_logs")
    .select("id, related_vehicle_id, expense_date, amount, description")
    .is("deleted_at", null);

  if (branch) {
    fuelQuery = fuelQuery.eq("branch_id", branch);
    maintenanceQuery = maintenanceQuery.eq("branch_id", branch);
    expenseQuery = expenseQuery.eq("branch_id", branch);
  }

  if (vehicle) {
    fuelQuery = fuelQuery.eq("vehicle_id", vehicle);
    maintenanceQuery = maintenanceQuery.eq("vehicle_id", vehicle);
    expenseQuery = expenseQuery.eq("related_vehicle_id", vehicle);
  }

  fuelQuery = applyDate(fuelQuery, "filled_at");
  maintenanceQuery = applyDate(maintenanceQuery, "service_date");
  expenseQuery = applyDate(expenseQuery, "expense_date");

  const [fuelResult, maintenanceResult, expenseResult] = await Promise.all([
    fuelQuery,
    maintenanceQuery,
    expenseQuery,
  ]);

  const fuelLogs = (fuelResult.data ?? []).map(
    (row): CostRow => ({
      id: row.id,
      type: "fuel",
      date: row.filled_at,
      vehicleId: row.vehicle_id,
      amount: row.total_amount,
      description: row.fuel_station ?? "Fuel",
    }),
  );

  const maintenanceLogs = (maintenanceResult.data ?? []).map(
    (row): CostRow => ({
      id: row.id,
      type: "maintenance",
      date: row.service_date,
      vehicleId: row.vehicle_id,
      amount: row.cost_amount,
      description: row.description,
    }),
  );

  const expenseLogs = (expenseResult.data ?? []).map(
    (row): CostRow => ({
      id: row.id,
      type: "expense",
      date: row.expense_date,
      vehicleId: row.related_vehicle_id,
      amount: row.amount,
      description: row.description,
    }),
  );

  const combined = [...fuelLogs, ...maintenanceLogs, ...expenseLogs].filter((row) => {
    if (!search) return true;
    return row.description.toLowerCase().includes(search.toLowerCase());
  });

  const sorted = combined.sort((a, b) => b.date.localeCompare(a.date));
  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));

  const csv = toCsv(
    sorted.map((row) => ({
      type: row.type,
      date: row.date,
      vehicle_id: row.vehicleId ?? "",
      amount: row.amount,
      description: row.description,
    })),
  );

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Reports</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Cost Report</h1>
          <p className="mt-2 text-sm text-slate-600">Fuel, maintenance, and expense costs.</p>
        </div>
        <a
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
          href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`}
          download="costs-report.csv"
        >
          Export CSV
        </a>
      </div>

      <form className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-6">
        <input
          name="search"
          defaultValue={search}
          placeholder="Search description"
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none sm:col-span-2"
        />
        <select
          name="branch"
          defaultValue={branch}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
        >
          <option value="">All Branches</option>
          {branches?.map((branchOption) => (
            <option key={branchOption.id} value={branchOption.id}>
              {branchOption.name}
            </option>
          ))}
        </select>
        <select
          name="vehicle"
          defaultValue={vehicle}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
        >
          <option value="">All Vehicles</option>
          {vehicles?.map((vehicleOption) => (
            <option key={vehicleOption.id} value={vehicleOption.id}>
              {vehicleOption.registration_number}
            </option>
          ))}
        </select>
        <input
          name="start"
          type="date"
          defaultValue={startDate}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
        />
        <input
          name="end"
          type="date"
          defaultValue={endDate}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
        />
        <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white sm:col-span-6">
          Apply
        </button>
      </form>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Vehicle</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paged.length ? (
              paged.map((row) => (
                <tr key={`${row.type}-${row.id}`} className="text-slate-700">
                  <td className="px-4 py-3 font-semibold text-slate-900">{row.type}</td>
                  <td className="px-4 py-3">{row.description}</td>
                  <td className="px-4 py-3">{row.vehicleId ?? "—"}</td>
                  <td className="px-4 py-3">{row.amount.toFixed(2)} SAR</td>
                  <td className="px-4 py-3">{row.date}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-slate-500" colSpan={5}>
                  No cost records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-600">
        <span>
          Page {page} of {totalPages}
        </span>
        <div className="flex gap-2">
          <Link
            className={`rounded-lg border border-slate-200 px-3 py-1 ${
              page <= 1 ? "pointer-events-none text-slate-300" : "text-slate-700"
            }`}
            href={`?search=${encodeURIComponent(search)}&branch=${branch}&vehicle=${vehicle}&start=${startDate}&end=${endDate}&page=${page - 1}`}
          >
            Previous
          </Link>
          <Link
            className={`rounded-lg border border-slate-200 px-3 py-1 ${
              page >= totalPages ? "pointer-events-none text-slate-300" : "text-slate-700"
            }`}
            href={`?search=${encodeURIComponent(search)}&branch=${branch}&vehicle=${vehicle}&start=${startDate}&end=${endDate}&page=${page + 1}`}
          >
            Next
          </Link>
        </div>
      </div>
    </main>
  );
}
