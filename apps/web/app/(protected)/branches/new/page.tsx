import AccessDenied from "@/components/AccessDenied";
import BranchForm from "@/components/branches/BranchForm";
import { createBranchAction } from "@/app/(protected)/branches/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function NewBranchPage() {
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

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-6 py-12">
      <BranchForm title="Create Branch" action={createBranchAction} submitLabel="Create Branch" />
    </main>
  );
}
