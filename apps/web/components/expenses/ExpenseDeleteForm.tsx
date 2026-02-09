"use client";

import { useFormState } from "react-dom";

import { ExpenseActionState, deleteExpenseAction } from "@/app/(protected)/expenses/actions";

export default function ExpenseDeleteForm({
  expenseId,
  expenseLabel,
}: {
  expenseId: string;
  expenseLabel: string;
}) {
  const emptyState: ExpenseActionState = {};
  const [state, formAction] = useFormState(deleteExpenseAction, emptyState);

  return (
    <form action={formAction} className="rounded-xl border border-rose-200 bg-rose-50 p-6">
      <h2 className="text-lg font-semibold text-rose-900">Delete Expense</h2>
      <p className="mt-2 text-sm text-rose-800">
        This will perform a soft delete. The expense will be removed from operational reporting.
      </p>
      <input type="hidden" name="expenseId" value={expenseId} />
      <div className="mt-4">
        <label className="text-sm font-medium text-rose-900" htmlFor="confirmLabel">
          Type the expense label to confirm
        </label>
        <input
          id="confirmLabel"
          name="confirmLabel"
          type="text"
          placeholder={expenseLabel}
          className="mt-1 w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-rose-400 focus:outline-none"
          required
          pattern={expenseLabel}
        />
      </div>
      {state.error ? <p className="mt-2 text-sm text-rose-700">{state.error}</p> : null}
      <button
        type="submit"
        className="mt-4 inline-flex items-center justify-center rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500"
      >
        Delete Expense
      </button>
    </form>
  );
}
