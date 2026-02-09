import AccessDenied from "@/components/AccessDenied";
import VehicleForm from "@/components/vehicles/VehicleForm";
import { updateVehicleAction } from "@/app/(protected)/vehicles/actions";
import { createVehicleRepo } from "@/lib/vehicles/repo";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function EditVehiclePage({ params }: { params: { id: string } }) {
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
    .eq("module", "vehicles")
    .maybeSingle();

  if (!profile.is_super_admin && !permission?.can_edit) {
    return <AccessDenied />;
  }

  const { data: branches } = await supabase
    .from("branches")
    .select("id, name")
    .is("deleted_at", null)
    .order("name");

  const repo = createVehicleRepo(supabase);
  const vehicle = await repo.findVehicleById(params.id);

  if (!vehicle) {
    return <AccessDenied message="Vehicle not found." />;
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 py-12">
      <VehicleForm
        title="Edit Vehicle"
        action={updateVehicleAction}
        submitLabel="Save Changes"
        branches={branches ?? []}
        vehicleId={vehicle.id}
        initialValues={{
          branchId: vehicle.branch_id,
          registrationNumber: vehicle.registration_number,
          make: vehicle.make ?? "",
          model: vehicle.model ?? "",
          year: vehicle.year ? String(vehicle.year) : "",
          color: vehicle.color ?? "",
          vin: vehicle.vin ?? "",
          fuelType: vehicle.fuel_type ?? "",
          odometer: String(vehicle.odometer),
          status: vehicle.status,
          notes: vehicle.notes ?? "",
        }}
      />
    </main>
  );
}
