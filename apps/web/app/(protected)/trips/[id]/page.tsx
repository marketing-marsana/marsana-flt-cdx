import Link from "next/link";
import { notFound } from "next/navigation";

import AccessDenied from "@/components/AccessDenied";
import TripDeleteForm from "@/components/trips/TripDeleteForm";
import TripWorkflowActions from "@/components/trips/TripWorkflowActions";
import { formatTripDateTime } from "@/lib/trips/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function formatCurrency(amount: number | null) {
  if (amount === null || Number.isNaN(amount)) {
    return "—";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "SAR",
  }).format(amount);
}

export default async function TripDetailPage({ params }: { params: { id: string } }) {
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
    .select("can_view, can_edit, can_delete")
    .eq("user_id", user.id)
    .eq("module", "trips")
    .maybeSingle();

  if (!profile.is_super_admin && !permission?.can_view) {
    return <AccessDenied />;
  }

  const { data: trip } = await supabase
    .from("trips")
    .select("*, drivers(full_name), vehicles(registration_number), branches(name)")
    .eq("id", params.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!trip) {
    notFound();
  }

  const driverName = (trip as { drivers?: { full_name?: string } | null }).drivers?.full_name;
  const vehicleReg = (trip as { vehicles?: { registration_number?: string } | null }).vehicles
    ?.registration_number;
  const branchName = (trip as { branches?: { name?: string } | null }).branches?.name;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Trip</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">{trip.trip_code}</h1>
          <p className="mt-2 text-sm text-slate-600">
            {trip.pickup_location} → {trip.dropoff_location}
          </p>
        </div>
        <div className="flex gap-3">
          {profile.is_super_admin || permission?.can_edit ? (
            <Link
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
              href={`/trips/${trip.id}/edit`}
            >
              Edit
            </Link>
          ) : null}
          <Link
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            href="/trips"
          >
            Back to List
          </Link>
        </div>
      </div>

      <section className="grid gap-6 rounded-xl border border-slate-200 bg-white p-6 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Status</p>
          <p className="mt-2 text-base font-medium text-slate-900">{trip.status}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Branch</p>
          <p className="mt-2 text-base font-medium text-slate-900">
            {branchName ?? trip.branch_id}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Driver</p>
          <p className="mt-2 text-base font-medium text-slate-900">{driverName ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Vehicle</p>
          <p className="mt-2 text-base font-medium text-slate-900">{vehicleReg ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Scheduled Start</p>
          <p className="mt-2 text-base font-medium text-slate-900">
            {formatTripDateTime(trip.scheduled_start_at)}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Scheduled End</p>
          <p className="mt-2 text-base font-medium text-slate-900">
            {formatTripDateTime(trip.scheduled_end_at)}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Actual Start</p>
          <p className="mt-2 text-base font-medium text-slate-900">
            {formatTripDateTime(trip.actual_start_at)}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Actual End</p>
          <p className="mt-2 text-base font-medium text-slate-900">
            {formatTripDateTime(trip.actual_end_at)}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Distance</p>
          <p className="mt-2 text-base font-medium text-slate-900">
            {trip.distance_km === null ? "—" : `${trip.distance_km} km`}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Fare</p>
          <p className="mt-2 text-base font-medium text-slate-900">
            {formatCurrency(trip.fare_amount)}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Customer</p>
          <p className="mt-2 text-base font-medium text-slate-900">{trip.customer_name ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Customer Phone</p>
          <p className="mt-2 text-base font-medium text-slate-900">{trip.customer_phone ?? "—"}</p>
        </div>
        <div className="sm:col-span-2">
          <p className="text-xs font-semibold uppercase text-slate-500">Notes</p>
          <p className="mt-2 text-base font-medium text-slate-900">{trip.notes ?? "—"}</p>
        </div>
      </section>

      {profile.is_super_admin || permission?.can_edit ? (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">Workflow Actions</h2>
          <p className="mt-1 text-sm text-slate-600">Use these buttons to progress the trip.</p>
          <div className="mt-4">
            <TripWorkflowActions tripId={trip.id} status={trip.status} />
          </div>
        </section>
      ) : null}

      {profile.is_super_admin || permission?.can_delete ? (
        <TripDeleteForm tripId={trip.id} tripCode={trip.trip_code} />
      ) : null}
    </main>
  );
}
