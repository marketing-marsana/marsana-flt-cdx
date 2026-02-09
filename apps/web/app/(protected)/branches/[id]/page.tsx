import Link from "next/link";
import { notFound } from "next/navigation";

import AccessDenied from "@/components/AccessDenied";
import BranchDeleteForm from "@/components/branches/BranchDeleteForm";
import { createBranchRepo } from "@/lib/branches/repo";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function BranchDetailPage({ params }: { params: { id: string } }) {
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
    notFound();
  }

  const activeUsers = await repo.countActiveUsers(branch.id);
  const relatedRecords = await repo.countRelatedRecords(branch.id);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Branch</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">{branch.name}</h1>
          <p className="mt-2 text-sm text-slate-600">Code: {branch.code}</p>
        </div>
        <div className="flex gap-3">
          <Link
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
            href={`/branches/${branch.id}/edit`}
          >
            Edit
          </Link>
          <Link
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            href="/branches"
          >
            Back to List
          </Link>
        </div>
      </div>

      <section className="grid gap-6 rounded-xl border border-slate-200 bg-white p-6 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Type</p>
          <p className="mt-2 text-base font-medium text-slate-900">{branch.type}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Status</p>
          <p className="mt-2 text-base font-medium text-slate-900">{branch.status}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Contact</p>
          <p className="mt-2 text-base font-medium text-slate-900">
            {branch.contact_number || "Not provided"}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Address</p>
          <p className="mt-2 text-base font-medium text-slate-900">
            {branch.address || "Not provided"}
          </p>
        </div>
      </section>

      <section className="grid gap-4 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Deletion Constraints</h2>
        <p className="text-sm text-slate-600">
          Active users: <span className="font-semibold text-slate-900">{activeUsers}</span>
        </p>
        <p className="text-sm text-slate-600">
          Related transactional records:{" "}
          <span className="font-semibold text-slate-900">{relatedRecords}</span>
        </p>
      </section>

      <BranchDeleteForm branchId={branch.id} branchName={branch.name} />
    </main>
  );
}
