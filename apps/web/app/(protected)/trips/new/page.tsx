import AccessDenied from "@/components/AccessDenied";
import TripForm from "@/components/trips/TripForm";
import { createTripAction } from "@/app/(protected)/trips/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function NewTripPage() {
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
    .select("can_create")
    .eq("user_id", user.id)
    .eq("module", "trips")
    .maybeSingle();

  if (!profile.is_super_admin && !permission?.can_create) {
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

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 py-12">
      <TripForm
        title="Create Trip"
        action={createTripAction}
        submitLabel="Create Trip"
        branches={branches ?? []}
        drivers={drivers ?? []}
        vehicles={vehicles ?? []}
        initialValues={{
          branchId: profile.branch_id ?? "",
        }}
      />
    </main>
  );
}
