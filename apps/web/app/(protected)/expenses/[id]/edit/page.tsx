import AccessDenied from "@/components/AccessDenied";
import ExpenseForm from "@/components/expenses/ExpenseForm";
import { updateExpenseAction } from "@/app/(protected)/expenses/actions";
import { toExpenseDateTimeLocalValue } from "@/lib/expenses/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function EditExpensePage({ params }: { params: { id: string } }) {
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
    .select("can_edit")
    .eq("user_id", user.id)
    .eq("module", "expenses")
    .maybeSingle();

  if (!profile.is_super_admin && !permission?.can_edit) {
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

  const { data: expense } = await supabase
    .from("expense_logs")
    .select("*")
    .eq("id", params.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!expense) {
    return <AccessDenied message="Expense log not found." />;
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 py-12">
      <ExpenseForm
        title="Edit Expense"
        action={updateExpenseAction}
        submitLabel="Save Changes"
        expenseId={expense.id}
        branches={branches ?? []}
        vehicles={vehicles ?? []}
        trips={trips ?? []}
        initialValues={{
          branchId: expense.branch_id,
          relatedVehicleId: expense.related_vehicle_id ?? "",
          relatedTripId: expense.related_trip_id ?? "",
          expenseDate: toExpenseDateTimeLocalValue(expense.expense_date),
          category: expense.category,
          description: expense.description,
          amount: String(expense.amount),
          paymentMethod: expense.payment_method,
          notes: expense.notes ?? "",
        }}
      />
    </main>
  );
}
