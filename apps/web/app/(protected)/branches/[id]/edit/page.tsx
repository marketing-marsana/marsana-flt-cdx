import AccessDenied from "@/components/AccessDenied";
import BranchForm from "@/components/branches/BranchForm";
import { updateBranchAction } from "@/app/(protected)/branches/actions";
import { createBranchRepo } from "@/lib/branches/repo";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function EditBranchPage({ params }: { params: { id: string } }) {
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

  const repo = createBranchRepo(supabase);
  const branch = await repo.findBranchById(params.id);

  if (!branch) {
    return <AccessDenied message="Branch not found." />;
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-6 py-12">
      <BranchForm
        title="Edit Branch"
        action={updateBranchAction}
        submitLabel="Save Changes"
        branchId={branch.id}
        initialValues={{
          name: branch.name,
          code: branch.code,
          type: branch.type,
          status: branch.status,
          address: branch.address ?? "",
          contactNumber: branch.contact_number ?? "",
        }}
      />
    </main>
  );
}
