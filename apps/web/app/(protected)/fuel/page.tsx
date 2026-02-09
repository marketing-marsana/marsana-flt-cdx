import Link from "next/link";

import AccessDenied from "@/components/AccessDenied";
import { formatFuelDateTime } from "@/lib/fuel/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const PAGE_SIZE = 10;

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

export default async function FuelPage({
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
    .select("can_view, can_create")
    .eq("user_id", user.id)
    .eq("module", "fuel")
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

  let query = supabase
    .from("fuel_logs")
    .select(
      "id, filled_at, quantity_liters, total_amount, odometer, fuel_station, branch_id, vehicle_id, trip_id, vehicles(registration_number), trips(trip_code), branches(name)",
      { count: "exact" },
    )
    .is("deleted_at", null)
    .order("filled_at", { ascending: false });

  if (search) {
    query = query.or(`fuel_station.ilike.%${search}%,notes.ilike.%${search}%`);
  }

  if (branch) {
    query = query.eq("branch_id", branch);
  }

  if (vehicle) {
    query = query.eq("vehicle_id", vehicle);
  }

  if (startDate) {
    query = query.gte("filled_at", `${startDate}T00:00:00`);
  }

  if (endDate) {
    query = query.lte("filled_at", `${endDate}T23:59:59`);
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data: fuelLogs, count } = await query.range(from, to);

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Operations</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Fuel Logs</h1>
          <p className="mt-2 text-sm text-slate-600">Track fuel consumption and costs.</p>
        </div>
        {profile.is_super_admin || permission?.can_create ? (
          <Link
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            href="/fuel/new"
          >
            New Fuel Log
          </Link>
        ) : null}
      </div>

      <form className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-6">
        <input
          name="search"
          defaultValue={search}
          placeholder="Search station or notes"
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
              <th className="px-4 py-3">Vehicle</th>
              <th className="px-4 py-3">Trip</th>
              <th className="px-4 py-3">Quantity</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Odometer</th>
              <th className="px-4 py-3">Filled At</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {fuelLogs?.length ? (
              fuelLogs.map((fuelLog) => {
                const vehicleReg = (
                  fuelLog as { vehicles?: { registration_number?: string } | null }
                ).vehicles?.registration_number;
                const tripCode = (fuelLog as { trips?: { trip_code?: string } | null }).trips
                  ?.trip_code;
                return (
                  <tr key={fuelLog.id} className="text-slate-700">
                    <td className="px-4 py-3 font-semibold text-slate-900">{vehicleReg ?? "—"}</td>
                    <td className="px-4 py-3">{tripCode ?? "—"}</td>
                    <td className="px-4 py-3">{fuelLog.quantity_liters} L</td>
                    <td className="px-4 py-3">{fuelLog.total_amount.toFixed(2)} SAR</td>
                    <td className="px-4 py-3">{fuelLog.odometer}</td>
                    <td className="px-4 py-3">{formatFuelDateTime(fuelLog.filled_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3 text-sm font-semibold">
                        <Link
                          className="text-slate-700 hover:text-slate-900"
                          href={`/fuel/${fuelLog.id}`}
                        >
                          View
                        </Link>
                        <Link
                          className="text-slate-700 hover:text-slate-900"
                          href={`/fuel/${fuelLog.id}/edit`}
                        >
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-slate-500" colSpan={7}>
                  No fuel logs found.
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
