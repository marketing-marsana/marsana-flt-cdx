import Link from "next/link";

import AccessDenied from "@/components/AccessDenied";
import { formatTripDateTime } from "@/lib/trips/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const PAGE_SIZE = 10;

function getPageParam(value: string | string[] | undefined) {
  const parsed = Number(Array.isArray(value) ? value[0] : value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function getStatusParam(value: string | string[] | undefined) {
  const status = Array.isArray(value) ? value[0] : value;
  if (
    status === "SCHEDULED" ||
    status === "IN_PROGRESS" ||
    status === "COMPLETED" ||
    status === "CANCELLED"
  ) {
    return status;
  }
  return "";
}

function getDateParam(value: string | string[] | undefined) {
  const dateValue = Array.isArray(value) ? value[0] : value;
  if (!dateValue) {
    return "";
  }
  return /^\d{4}-\d{2}-\d{2}$/.test(dateValue) ? dateValue : "";
}

export default async function TripsPage({
  searchParams,
}: {
  searchParams?: { search?: string; status?: string; start?: string; end?: string; page?: string };
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
    .eq("module", "trips")
    .maybeSingle();

  if (!profile.is_super_admin && !permission?.can_view) {
    return <AccessDenied />;
  }

  const page = getPageParam(searchParams?.page);
  const search = (searchParams?.search ?? "").trim();
  const status = getStatusParam(searchParams?.status);
  const startDate = getDateParam(searchParams?.start);
  const endDate = getDateParam(searchParams?.end);

  let query = supabase
    .from("trips")
    .select(
      "id, trip_code, status, scheduled_start_at, scheduled_end_at, customer_name, pickup_location, dropoff_location, drivers(full_name), vehicles(registration_number), branches(name)",
      { count: "exact" },
    )
    .is("deleted_at", null)
    .order("scheduled_start_at", { ascending: false });

  if (search) {
    query = query.or(
      `trip_code.ilike.%${search}%,customer_name.ilike.%${search}%,pickup_location.ilike.%${search}%,dropoff_location.ilike.%${search}%`,
    );
  }

  if (status) {
    query = query.eq("status", status);
  }

  if (startDate) {
    query = query.gte("scheduled_start_at", `${startDate}T00:00:00`);
  }

  if (endDate) {
    query = query.lte("scheduled_start_at", `${endDate}T23:59:59`);
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data: trips, count } = await query.range(from, to);

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Operations</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Trips</h1>
          <p className="mt-2 text-sm text-slate-600">Monitor scheduled and active trips.</p>
        </div>
        {profile.is_super_admin || permission?.can_create ? (
          <Link
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            href="/trips/new"
          >
            New Trip
          </Link>
        ) : null}
      </div>

      <form className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-5">
        <input
          name="search"
          defaultValue={search}
          placeholder="Search by trip code, customer, or location"
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none sm:col-span-2"
        />
        <select
          name="status"
          defaultValue={status}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
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
        <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white sm:col-span-5">
          Apply
        </button>
      </form>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Trip</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Driver</th>
              <th className="px-4 py-3">Vehicle</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Scheduled</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {trips?.length ? (
              trips.map((trip) => {
                const driverName = (trip as { drivers?: { full_name?: string } | null }).drivers
                  ?.full_name;
                const vehicleReg = (trip as { vehicles?: { registration_number?: string } | null })
                  .vehicles?.registration_number;
                return (
                  <tr key={trip.id} className="text-slate-700">
                    <td className="px-4 py-3 font-semibold text-slate-900">{trip.trip_code}</td>
                    <td className="px-4 py-3">{trip.customer_name ?? "—"}</td>
                    <td className="px-4 py-3">{driverName ?? "—"}</td>
                    <td className="px-4 py-3">{vehicleReg ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          trip.status === "COMPLETED"
                            ? "bg-emerald-100 text-emerald-700"
                            : trip.status === "IN_PROGRESS"
                              ? "bg-sky-100 text-sky-700"
                              : trip.status === "CANCELLED"
                                ? "bg-rose-100 text-rose-700"
                                : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {trip.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{formatTripDateTime(trip.scheduled_start_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3 text-sm font-semibold">
                        <Link
                          className="text-slate-700 hover:text-slate-900"
                          href={`/trips/${trip.id}`}
                        >
                          View
                        </Link>
                        <Link
                          className="text-slate-700 hover:text-slate-900"
                          href={`/trips/${trip.id}/edit`}
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
                  No trips found.
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
            href={`?search=${encodeURIComponent(search)}&status=${status}&start=${startDate}&end=${endDate}&page=${page - 1}`}
          >
            Previous
          </Link>
          <Link
            className={`rounded-lg border border-slate-200 px-3 py-1 ${
              page >= totalPages ? "pointer-events-none text-slate-300" : "text-slate-700"
            }`}
            href={`?search=${encodeURIComponent(search)}&status=${status}&start=${startDate}&end=${endDate}&page=${page + 1}`}
          >
            Next
          </Link>
        </div>
      </div>
    </main>
  );
}
