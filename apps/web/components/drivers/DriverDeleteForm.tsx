"use client";

import { useFormState } from "react-dom";

import { DriverActionState, deleteDriverAction } from "@/app/(protected)/drivers/actions";

export default function DriverDeleteForm({
  driverId,
  fullName,
}: {
  driverId: string;
  fullName: string;
}) {
  const emptyState: DriverActionState = {};
  const [state, formAction] = useFormState(deleteDriverAction, emptyState);

  return (
    <form action={formAction} className="rounded-xl border border-rose-200 bg-rose-50 p-6">
      <h2 className="text-lg font-semibold text-rose-900">Delete Driver</h2>
      <p className="mt-2 text-sm text-rose-800">
        This will perform a soft delete. This driver will no longer be available for assignments.
      </p>
      <input type="hidden" name="driverId" value={driverId} />
      <div className="mt-4">
        <label className="text-sm font-medium text-rose-900" htmlFor="confirmName">
          Type the driver name to confirm
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
        Delete Driver
      </button>
    </form>
  );
}
