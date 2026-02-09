import Link from "next/link";
import { notFound } from "next/navigation";

import AccessDenied from "@/components/AccessDenied";
import ExpenseDeleteForm from "@/components/expenses/ExpenseDeleteForm";
import { formatExpenseDateTime } from "@/lib/expenses/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function formatCurrency(amount: number | null) {
  if (amount === null || Number.isNaN(amount)) {
    return "—";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "SAR",
  }).format(amount);
}

export default async function ExpenseDetailPage({ params }: { params: { id: string } }) {
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

  if (!profile) {
    return <AccessDenied />;
  }

  const { data: permission } = await supabase
    .from("user_permissions")
    .select("can_view, can_edit, can_delete")
    .eq("user_id", user.id)
    .eq("module", "expenses")
    .maybeSingle();

  if (!profile.is_super_admin && !permission?.can_view) {
    return <AccessDenied />;
  }

  const { data: expense } = await supabase
    .from("expense_logs")
    .select("*, vehicles(registration_number), trips(trip_code), branches(name)")
    .eq("id", params.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!expense) {
    notFound();
  }

  const vehicleReg = (expense as { vehicles?: { registration_number?: string } | null }).vehicles
    ?.registration_number;
  const tripCode = (expense as { trips?: { trip_code?: string } | null }).trips?.trip_code;
  const branchName = (expense as { branches?: { name?: string } | null }).branches?.name;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Expense</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            {expense.category.toUpperCase()}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Expense date {formatExpenseDateTime(expense.expense_date)}
          </p>
        </div>
        <div className="flex gap-3">
          {profile.is_super_admin || permission?.can_edit ? (
            <Link
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
              href={`/expenses/${expense.id}/edit`}
            >
              Edit
            </Link>
          ) : null}
          <Link
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            href="/expenses"
          >
            Back to List
          </Link>
        </div>
      </div>

      <section className="grid gap-6 rounded-xl border border-slate-200 bg-white p-6 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Branch</p>
          <p className="mt-2 text-base font-medium text-slate-900">{branchName ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Vehicle</p>
          <p className="mt-2 text-base font-medium text-slate-900">{vehicleReg ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Trip</p>
          <p className="mt-2 text-base font-medium text-slate-900">{tripCode ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Payment Method</p>
          <p className="mt-2 text-base font-medium text-slate-900">{expense.payment_method}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Description</p>
          <p className="mt-2 text-base font-medium text-slate-900">{expense.description}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Amount</p>
          <p className="mt-2 text-base font-medium text-slate-900">
            {formatCurrency(expense.amount)}
          </p>
        </div>
        <div className="sm:col-span-2">
          <p className="text-xs font-semibold uppercase text-slate-500">Notes</p>
          <p className="mt-2 text-base font-medium text-slate-900">{expense.notes ?? "—"}</p>
        </div>
      </section>

      {profile.is_super_admin || permission?.can_delete ? (
        <ExpenseDeleteForm expenseId={expense.id} expenseLabel={expense.id} />
      ) : null}
    </main>
  );
}
