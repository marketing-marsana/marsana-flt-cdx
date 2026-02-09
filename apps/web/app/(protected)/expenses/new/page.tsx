import AccessDenied from "@/components/AccessDenied";
import ExpenseForm from "@/components/expenses/ExpenseForm";
import { createExpenseAction } from "@/app/(protected)/expenses/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function NewExpensePage() {
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
    .select("can_create")
    .eq("user_id", user.id)
    .eq("module", "expenses")
    .maybeSingle();

  if (!profile.is_super_admin && !permission?.can_create) {
    return <AccessDenied />;
  }

  const { data: branches } = await supabase
    .from("branches")
    .select("id, name")
    .is("deleted_at", null)
    .order("name");

  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id, registration_number, branch_id")
    .is("deleted_at", null)
    .order("registration_number");

  const { data: trips } = await supabase
    .from("trips")
    .select("id, trip_code, branch_id, vehicle_id")
    .is("deleted_at", null)
    .order("scheduled_start_at", { ascending: false });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 py-12">
      <ExpenseForm
        title="Create Expense"
        action={createExpenseAction}
        submitLabel="Create Expense"
        branches={branches ?? []}
        vehicles={vehicles ?? []}
        trips={trips ?? []}
        initialValues={{
          branchId: profile.branch_id ?? "",
        }}
      />
    </main>
  );
}
