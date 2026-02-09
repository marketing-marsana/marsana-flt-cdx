import Link from "next/link";

import AccessDenied from "@/components/AccessDenied";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const PAGE_SIZE = 10;

function getPageParam(value: string | string[] | undefined) {
  const parsed = Number(Array.isArray(value) ? value[0] : value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function getStatusParam(value: string | string[] | undefined) {
  const status = Array.isArray(value) ? value[0] : value;
  if (status === "ACTIVE" || status === "INACTIVE") {
    return status;
  }
  return "";
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams?: { search?: string; status?: string; branch?: string; page?: string };
}) {
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

  const page = getPageParam(searchParams?.page);
  const search = (searchParams?.search ?? "").trim();
  const status = getStatusParam(searchParams?.status);
  const branch = (searchParams?.branch ?? "").trim();

  let query = supabase
    .from("user_profiles")
    .select(
      "user_id, full_name, email, phone, designation, is_super_admin, is_active, branch_id, branches(name)",
      { count: "exact" },
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  if (status) {
    query = query.eq("is_active", status === "ACTIVE");
  }

  if (branch) {
    query = query.eq("branch_id", branch);
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data: users, count } = await query.range(from, to);

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Admin</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Users</h1>
          <p className="mt-2 text-sm text-slate-600">Manage users and their permissions.</p>
        </div>
        <Link
          className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          href="/users/new"
        >
          New User
        </Link>
      </div>

      <form className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-4">
        <input
          name="search"
          defaultValue={search}
          placeholder="Search by name or email"
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none sm:col-span-2"
        />
        <select
          name="branch"
          defaultValue={branch}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
        >
          <option value="">All Branches</option>
          {branches?.map((branchOption) => (
            <option key={branchOption.id} value={branchOption.id}>
              {branchOption.name}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={status}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white sm:col-span-4">
          Apply
        </button>
      </form>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Branch</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users?.length ? (
              users.map((profileRow) => {
                const branchName = (profileRow as { branches?: { name?: string } | null }).branches
                  ?.name;
                return (
                  <tr key={profileRow.user_id} className="text-slate-700">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {profileRow.full_name}
                    </td>
                    <td className="px-4 py-3">{profileRow.email}</td>
                    <td className="px-4 py-3">{branchName ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          profileRow.is_active
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {profileRow.is_active ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3 text-sm font-semibold">
                        <Link
                          className="text-slate-700 hover:text-slate-900"
                          href={`/users/${profileRow.user_id}`}
                        >
                          View
                        </Link>
                        <Link
                          className="text-slate-700 hover:text-slate-900"
                          href={`/users/${profileRow.user_id}/edit`}
                        >
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-slate-500" colSpan={5}>
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-600">
        <span>
          Page {page} of {totalPages}
        </span>
        <div className="flex gap-2">
          <Link
            className={`rounded-lg border border-slate-200 px-3 py-1 ${
              page <= 1 ? "pointer-events-none text-slate-300" : "text-slate-700"
            }`}
            href={`?search=${encodeURIComponent(search)}&status=${status}&branch=${branch}&page=${page - 1}`}
          >
            Previous
          </Link>
          <Link
            className={`rounded-lg border border-slate-200 px-3 py-1 ${
              page >= totalPages ? "pointer-events-none text-slate-300" : "text-slate-700"
            }`}
            href={`?search=${encodeURIComponent(search)}&status=${status}&branch=${branch}&page=${page + 1}`}
          >
            Next
          </Link>
        </div>
      </div>
    </main>
  );
}
