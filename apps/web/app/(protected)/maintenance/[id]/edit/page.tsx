import AccessDenied from "@/components/AccessDenied";
import MaintenanceForm from "@/components/maintenance/MaintenanceForm";
import { updateMaintenanceAction } from "@/app/(protected)/maintenance/actions";
import { toMaintenanceDateTimeLocalValue } from "@/lib/maintenance/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function EditMaintenancePage({ params }: { params: { id: string } }) {
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
    .eq("module", "maintenance")
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

  const { data: maintenanceLog } = await supabase
    .from("maintenance_logs")
    .select("*")
    .eq("id", params.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!maintenanceLog) {
    return <AccessDenied message="Maintenance log not found." />;
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 py-12">
      <MaintenanceForm
        title="Edit Maintenance Log"
        action={updateMaintenanceAction}
        submitLabel="Save Changes"
        maintenanceId={maintenanceLog.id}
        branches={branches ?? []}
        vehicles={vehicles ?? []}
        trips={trips ?? []}
        initialValues={{
          branchId: maintenanceLog.branch_id,
          vehicleId: maintenanceLog.vehicle_id,
          tripId: maintenanceLog.trip_id ?? "",
          serviceDate: toMaintenanceDateTimeLocalValue(maintenanceLog.service_date),
          maintenanceType: maintenanceLog.maintenance_type,
          description: maintenanceLog.description,
          vendorOrWorkshop: maintenanceLog.vendor_or_workshop ?? "",
          costAmount: String(maintenanceLog.cost_amount),
          odometer: String(maintenanceLog.odometer),
          nextServiceOdometer: maintenanceLog.next_service_odometer
            ? String(maintenanceLog.next_service_odometer)
            : "",
          nextServiceDate: maintenanceLog.next_service_date
            ? maintenanceLog.next_service_date.split("T")[0]
            : "",
          notes: maintenanceLog.notes ?? "",
        }}
      />
    </main>
  );
}
