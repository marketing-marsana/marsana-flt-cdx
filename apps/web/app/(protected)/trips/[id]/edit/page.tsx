import AccessDenied from "@/components/AccessDenied";
import TripForm from "@/components/trips/TripForm";
import { updateTripAction } from "@/app/(protected)/trips/actions";
import { toDateTimeLocalValue } from "@/lib/trips/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function EditTripPage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("is_super_admin, branch_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) {
    return <AccessDenied />;
  }

  const { data: permission } = await supabase
    .from("user_permissions")
    .select("can_edit")
    .eq("user_id", user.id)
    .eq("module", "trips")
    .maybeSingle();

  if (!profile.is_super_admin && !permission?.can_edit) {
    return <AccessDenied />;
  }

  const { data: branches } = await supabase
    .from("branches")
    .select("id, name")
    .is("deleted_at", null)
    .order("name");

  const { data: drivers } = await supabase
    .from("drivers")
    .select("id, full_name, branch_id")
    .is("deleted_at", null)
    .order("full_name");

  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id, registration_number, branch_id")
    .is("deleted_at", null)
    .order("registration_number");

  const { data: trip } = await supabase
    .from("trips")
    .select("*")
    .eq("id", params.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!trip) {
    return <AccessDenied message="Trip not found." />;
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 py-12">
      <TripForm
        title="Edit Trip"
        action={updateTripAction}
        submitLabel="Save Changes"
        tripId={trip.id}
        branches={branches ?? []}
        drivers={drivers ?? []}
        vehicles={vehicles ?? []}
        initialValues={{
          branchId: trip.branch_id,
          driverId: trip.driver_id,
          vehicleId: trip.vehicle_id,
          tripCode: trip.trip_code,
          customerName: trip.customer_name ?? "",
          customerPhone: trip.customer_phone ?? "",
          pickupLocation: trip.pickup_location,
          dropoffLocation: trip.dropoff_location,
          scheduledStartAt: toDateTimeLocalValue(trip.scheduled_start_at),
          scheduledEndAt: toDateTimeLocalValue(trip.scheduled_end_at),
          actualStartAt: trip.actual_start_at ?? "",
          actualEndAt: trip.actual_end_at ?? "",
          distanceKm: trip.distance_km ? String(trip.distance_km) : "",
          fareAmount: trip.fare_amount ? String(trip.fare_amount) : "",
          status: trip.status,
          notes: trip.notes ?? "",
        }}
      />
    </main>
  );
}
