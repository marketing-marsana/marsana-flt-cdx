import Link from "next/link";
import { notFound } from "next/navigation";

import AccessDenied from "@/components/AccessDenied";
import UserDeleteForm from "@/components/users/UserDeleteForm";
import { DEFAULT_PERMISSIONS } from "@/lib/users/permissions";
import { createUserRepo } from "@/lib/users/repo";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function UserDetailPage({ params }: { params: { id: string } }) {
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
    notFound();
  }

  const permissions = await repo.fetchPermissions(params.id);
  const permissionMap = new Map(permissions.map((perm) => [perm.module, perm]));

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">User</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">{userProfile.full_name}</h1>
          <p className="mt-2 text-sm text-slate-600">{userProfile.email}</p>
        </div>
        <div className="flex gap-3">
          <Link
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
            href={`/users/${userProfile.user_id}/edit`}
          >
            Edit
          </Link>
          <Link
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            href="/users"
          >
            Back to List
          </Link>
        </div>
      </div>

      <section className="grid gap-6 rounded-xl border border-slate-200 bg-white p-6 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Designation</p>
          <p className="mt-2 text-base font-medium text-slate-900">
            {userProfile.designation || "Not provided"}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Status</p>
          <p className="mt-2 text-base font-medium text-slate-900">
            {userProfile.is_active ? "ACTIVE" : "INACTIVE"}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Phone</p>
          <p className="mt-2 text-base font-medium text-slate-900">
            {userProfile.phone || "Not provided"}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Branch</p>
          <p className="mt-2 text-base font-medium text-slate-900">
            {userProfile.branch_id ?? "—"}
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Permissions</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Module</th>
                <th className="px-4 py-3">View</th>
                <th className="px-4 py-3">Create</th>
                <th className="px-4 py-3">Edit</th>
                <th className="px-4 py-3">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {DEFAULT_PERMISSIONS.map((row) => {
                const existing = permissionMap.get(row.module) ?? row;
                return (
                  <tr key={row.module}>
                    <td className="px-4 py-3 font-semibold text-slate-900">{row.module}</td>
                    <td className="px-4 py-3">{existing.can_view ? "Yes" : "No"}</td>
                    <td className="px-4 py-3">{existing.can_create ? "Yes" : "No"}</td>
                    <td className="px-4 py-3">{existing.can_edit ? "Yes" : "No"}</td>
                    <td className="px-4 py-3">{existing.can_delete ? "Yes" : "No"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <UserDeleteForm userId={userProfile.user_id} fullName={userProfile.full_name} />
    </main>
  );
}
