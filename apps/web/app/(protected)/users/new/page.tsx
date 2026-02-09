import AccessDenied from "@/components/AccessDenied";
import UserForm from "@/components/users/UserForm";
import { createUserAction } from "@/app/(protected)/users/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function NewUserPage() {
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

  if (!profile?.is_super_admin) {
    return <AccessDenied />;
  }

  const { data: branches } = await supabase
    .from("branches")
    .select("id, name")
    .is("deleted_at", null)
    .order("name");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 py-12">
      <UserForm
        title="Create User"
        action={createUserAction}
        submitLabel="Create User"
        branches={branches ?? []}
      />
    </main>
  );
}
