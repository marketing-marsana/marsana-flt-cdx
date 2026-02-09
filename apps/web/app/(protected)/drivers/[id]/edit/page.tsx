import AccessDenied from "@/components/AccessDenied";
import DriverForm from "@/components/drivers/DriverForm";
import { updateDriverAction } from "@/app/(protected)/drivers/actions";
import { createDriverRepo } from "@/lib/drivers/repo";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function EditDriverPage({ params }: { params: { id: string } }) {
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
    .eq("module", "drivers")
    .maybeSingle();

  if (!profile.is_super_admin && !permission?.can_edit) {
    return <AccessDenied />;
  }

  const { data: branches } = await supabase
    .from("branches")
    .select("id, name")
    .is("deleted_at", null)
    .order("name");

  const repo = createDriverRepo(supabase);
  const driver = await repo.findDriverById(params.id);

  if (!driver) {
    return <AccessDenied message="Driver not found." />;
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 py-12">
      <DriverForm
        title="Edit Driver"
        action={updateDriverAction}
        submitLabel="Save Changes"
        branches={branches ?? []}
        driverId={driver.id}
        initialValues={{
          branchId: driver.branch_id,
          fullName: driver.full_name,
          phone: driver.phone,
          licenseNumber: driver.license_number,
          licenseExpiryDate: driver.license_expiry_date ?? "",
          status: driver.status,
          notes: driver.notes ?? "",
        }}
      />
    </main>
  );
}
