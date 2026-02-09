import Link from "next/link";
import { notFound } from "next/navigation";

import AccessDenied from "@/components/AccessDenied";
import DriverDeleteForm from "@/components/drivers/DriverDeleteForm";
import { createDriverRepo } from "@/lib/drivers/repo";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DriverDetailPage({ params }: { params: { id: string } }) {
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
    .select("can_view")
    .eq("user_id", user.id)
    .eq("module", "drivers")
    .maybeSingle();

  if (!profile.is_super_admin && !permission?.can_view) {
    return <AccessDenied />;
  }

  const repo = createDriverRepo(supabase);
  const driver = await repo.findDriverById(params.id);

  if (!driver) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Driver</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">{driver.full_name}</h1>
          <p className="mt-2 text-sm text-slate-600">License: {driver.license_number}</p>
        </div>
        <div className="flex gap-3">
          <Link
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
            href={`/drivers/${driver.id}/edit`}
          >
            Edit
          </Link>
          <Link
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            href="/drivers"
          >
            Back to List
          </Link>
        </div>
      </div>

      <section className="grid gap-6 rounded-xl border border-slate-200 bg-white p-6 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Phone</p>
          <p className="mt-2 text-base font-medium text-slate-900">{driver.phone}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Status</p>
          <p className="mt-2 text-base font-medium text-slate-900">{driver.status}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">License Expiry</p>
          <p className="mt-2 text-base font-medium text-slate-900">
            {driver.license_expiry_date ?? "Not provided"}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Branch</p>
          <p className="mt-2 text-base font-medium text-slate-900">{driver.branch_id}</p>
        </div>
        <div className="sm:col-span-2">
          <p className="text-xs font-semibold uppercase text-slate-500">Notes</p>
          <p className="mt-2 text-base font-medium text-slate-900">{driver.notes || "—"}</p>
        </div>
      </section>

      <DriverDeleteForm driverId={driver.id} fullName={driver.full_name} />
    </main>
  );
}
