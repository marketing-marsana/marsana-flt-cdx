"use client";

import { useFormState } from "react-dom";

import { BranchActionState, deleteBranchAction } from "@/app/(protected)/branches/actions";

export default function BranchDeleteForm({
  branchId,
  branchName,
}: {
  branchId: string;
  branchName: string;
}) {
  const emptyState: BranchActionState = {};
  const [state, formAction] = useFormState(deleteBranchAction, emptyState);

  return (
    <form action={formAction} className="rounded-xl border border-rose-200 bg-rose-50 p-6">
      <h2 className="text-lg font-semibold text-rose-900">Delete Branch</h2>
      <p className="mt-2 text-sm text-rose-800">
        This will perform a soft delete. Deletion is blocked if there are active users or
        transactional records linked to this branch.
      </p>
      <input type="hidden" name="branchId" value={branchId} />
      <div className="mt-4">
        <label className="text-sm font-medium text-rose-900" htmlFor="confirmName">
          Type the branch name to confirm
        </label>
        <input
          id="confirmName"
          name="confirmName"
          type="text"
          placeholder={branchName}
          className="mt-1 w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-rose-400 focus:outline-none"
          required
          pattern={branchName}
        />
      </div>
      {state.error ? <p className="mt-2 text-sm text-rose-700">{state.error}</p> : null}
      <button
        type="submit"
        className="mt-4 inline-flex items-center justify-center rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500"
      >
        Delete Branch
      </button>
    </form>
  );
}
