import AccessDenied from "@/components/AccessDenied";
import UserForm from "@/components/users/UserForm";
import { updateUserAction } from "@/app/(protected)/users/actions";
import { DEFAULT_PERMISSIONS } from "@/lib/users/permissions";
import { createUserRepo } from "@/lib/users/repo";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function EditUserPage({ params }: { params: { id: string } }) {
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

  const repo = createUserRepo(supabase, {
    async createUser() {
      throw new Error("Not supported.");
    },
    async updateUser() {
      throw new Error("Not supported.");
    },
  });

  const userProfile = await repo.getUserProfile(params.id);
  if (!userProfile) {
    return <AccessDenied message="User not found." />;
  }

  const permissions = await repo.fetchPermissions(params.id);
  const permissionMap = new Map(permissions.map((perm) => [perm.module, perm]));
  const mergedPermissions = DEFAULT_PERMISSIONS.map(
    (permission) => permissionMap.get(permission.module) ?? permission,
  );

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 py-12">
      <UserForm
        title="Edit User"
        action={updateUserAction}
        submitLabel="Save Changes"
        branches={branches ?? []}
        userId={userProfile.user_id}
        initialValues={{
          fullName: userProfile.full_name,
          email: userProfile.email,
          phone: userProfile.phone ?? "",
          branchId: userProfile.branch_id ?? "",
          designation: userProfile.designation ?? "",
          status: userProfile.is_active ? "ACTIVE" : "INACTIVE",
          isSuperAdmin: userProfile.is_super_admin,
          permissions: mergedPermissions,
        }}
      />
    </main>
  );
}
