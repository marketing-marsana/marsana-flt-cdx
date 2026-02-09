import AccessDenied from "@/components/AccessDenied";
import DriverForm from "@/components/drivers/DriverForm";
import { createDriverAction } from "@/app/(protected)/drivers/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function NewDriverPage() {
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
    .eq("module", "drivers")
    .maybeSingle();

  if (!profile.is_super_admin && !permission?.can_create) {
    return <AccessDenied />;
  }

  const { data: branches } = await supabase
    .from("branches")
    .select("id, name")
    .is("deleted_at", null)
    .order("name");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 py-12">
      <DriverForm
        title="Create Driver"
        action={createDriverAction}
        submitLabel="Create Driver"
        branches={branches ?? []}
        initialValues={{
          branchId: profile.branch_id ?? "",
        }}
      />
    </main>
  );
}
