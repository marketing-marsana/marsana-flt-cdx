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

export default async function BranchesPage({
  searchParams,
}: {
  searchParams?: { search?: string; status?: string; page?: string };
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

  const page = getPageParam(searchParams?.page);
  const search = (searchParams?.search ?? "").trim();
  const status = getStatusParam(searchParams?.status);

  let query = supabase
    .from("branches")
    .select("id, name, code, type, status, created_at, deleted_at", {
      count: "exact",
    })
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`);
  }

  if (status) {
    query = query.eq("status", status);
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: branches, count } = await query.range(from, to);
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Admin</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Branches</h1>
          <p className="mt-2 text-sm text-slate-600">
            Manage all branches across the organization.
          </p>
        </div>
        <Link
          className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          href="/branches/new"
        >
          New Branch
        </Link>
      </div>

      <form className="flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <input
          name="search"
          defaultValue={search}
          placeholder="Search by name or code"
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
        />
        <select
          name="status"
          defaultValue={status}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
          Apply
        </button>
      </form>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {branches?.length ? (
              branches.map((branch) => (
                <tr key={branch.id} className="text-slate-700">
                  <td className="px-4 py-3 font-semibold text-slate-900">{branch.name}</td>
                  <td className="px-4 py-3">{branch.code}</td>
                  <td className="px-4 py-3">{branch.type}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        branch.status === "ACTIVE"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {branch.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3 text-sm font-semibold">
                      <Link
                        className="text-slate-700 hover:text-slate-900"
                        href={`/branches/${branch.id}`}
                      >
                        View
                      </Link>
                      <Link
                        className="text-slate-700 hover:text-slate-900"
                        href={`/branches/${branch.id}/edit`}
                      >
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-slate-500" colSpan={5}>
                  No branches found.
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
            href={`?search=${encodeURIComponent(search)}&status=${status}&page=${page - 1}`}
          >
            Previous
          </Link>
          <Link
            className={`rounded-lg border border-slate-200 px-3 py-1 ${
              page >= totalPages ? "pointer-events-none text-slate-300" : "text-slate-700"
            }`}
            href={`?search=${encodeURIComponent(search)}&status=${status}&page=${page + 1}`}
          >
            Next
          </Link>
        </div>
      </div>
    </main>
  );
}
