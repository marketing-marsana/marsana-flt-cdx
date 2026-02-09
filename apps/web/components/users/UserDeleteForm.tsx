"use client";

import { useFormState } from "react-dom";

import { UserActionState, deleteUserAction } from "@/app/(protected)/users/actions";

export default function UserDeleteForm({ userId, fullName }: { userId: string; fullName: string }) {
  const emptyState: UserActionState = {};
  const [state, formAction] = useFormState(deleteUserAction, emptyState);

  return (
    <form action={formAction} className="rounded-xl border border-rose-200 bg-rose-50 p-6">
      <h2 className="text-lg font-semibold text-rose-900">Delete User</h2>
      <p className="mt-2 text-sm text-rose-800">
        This will soft delete the user and immediately disable their access.
      </p>
      <input type="hidden" name="userId" value={userId} />
      <div className="mt-4">
        <label className="text-sm font-medium text-rose-900" htmlFor="confirmName">
          Type the user name to confirm
        </label>
        <input
          id="confirmName"
          name="confirmName"
          type="text"
          placeholder={fullName}
          className="mt-1 w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-rose-400 focus:outline-none"
          required
          pattern={fullName}
        />
      </div>
      {state.error ? <p className="mt-2 text-sm text-rose-700">{state.error}</p> : null}
      <button
        type="submit"
        className="mt-4 inline-flex items-center justify-center rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500"
      >
        Delete User
      </button>
    </form>
  );
}
