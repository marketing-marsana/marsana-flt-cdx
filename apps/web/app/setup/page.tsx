import { redirect } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import SetupForm from "./SetupForm";

export default async function SetupPage() {
  let admin;
  try {
    admin = createSupabaseAdminClient();
  } catch (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
        <div className="w-full max-w-xl rounded-2xl border border-rose-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">Setup Unavailable</h1>
          <p className="mt-3 text-sm text-slate-600">
            {error instanceof Error ? error.message : "Missing server configuration."}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local` on the server.
          </p>
        </div>
      </main>
    );
  }

  const { data, error } = await admin
    .from("user_profiles")
    .select("user_id")
    .eq("is_super_admin", true)
    .is("deleted_at", null)
    .limit(1);

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
        <div className="w-full max-w-xl rounded-2xl border border-rose-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">Setup Error</h1>
          <p className="mt-3 text-sm text-slate-600">{error.message}</p>
        </div>
      </main>
    );
  }

  if (data && data.length > 0) {
    redirect("/login");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            One-Time Setup
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-slate-900">Create Super Admin</h1>
          <p className="mt-2 text-sm text-slate-600">
            This setup can only be completed once. After success, the setup route is locked.
          </p>
        </div>
        <div className="mt-6">
          <SetupForm />
        </div>
      </div>
    </main>
  );
}
