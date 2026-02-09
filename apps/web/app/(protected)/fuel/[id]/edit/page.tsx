import AccessDenied from "@/components/AccessDenied";
import FuelForm from "@/components/fuel/FuelForm";
import { updateFuelLogAction } from "@/app/(protected)/fuel/actions";
import { toFuelDateTimeLocalValue } from "@/lib/fuel/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function EditFuelLogPage({ params }: { params: { id: string } }) {
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
    .eq("module", "fuel")
    .maybeSingle();

  if (!profile.is_super_admin && !permission?.can_edit) {
    return <AccessDenied />;
  }

  const { data: branches } = await supabase
    .from("branches")
    .select("id, name")
    .is("deleted_at", null)
    .order("name");

  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id, registration_number, branch_id")
    .is("deleted_at", null)
    .order("registration_number");

  const { data: trips } = await supabase
    .from("trips")
    .select("id, trip_code, branch_id, vehicle_id")
    .is("deleted_at", null)
    .order("scheduled_start_at", { ascending: false });

  const { data: fuelLog } = await supabase
    .from("fuel_logs")
    .select("*")
    .eq("id", params.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!fuelLog) {
    return <AccessDenied message="Fuel log not found." />;
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 py-12">
      <FuelForm
        title="Edit Fuel Log"
        action={updateFuelLogAction}
        submitLabel="Save Changes"
        fuelId={fuelLog.id}
        branches={branches ?? []}
        vehicles={vehicles ?? []}
        trips={trips ?? []}
        initialValues={{
          branchId: fuelLog.branch_id,
          vehicleId: fuelLog.vehicle_id,
          tripId: fuelLog.trip_id ?? "",
          filledAt: toFuelDateTimeLocalValue(fuelLog.filled_at),
          quantityLiters: String(fuelLog.quantity_liters),
          pricePerLiter: String(fuelLog.price_per_liter),
          totalAmount: String(fuelLog.total_amount.toFixed(2)),
          odometer: String(fuelLog.odometer),
          fuelStation: fuelLog.fuel_station ?? "",
          notes: fuelLog.notes ?? "",
        }}
      />
    </main>
  );
}
