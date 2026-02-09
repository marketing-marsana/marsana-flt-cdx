"use client";

import { useFormState } from "react-dom";

import {
  MaintenanceActionState,
  deleteMaintenanceAction,
} from "@/app/(protected)/maintenance/actions";

export default function MaintenanceDeleteForm({
  maintenanceId,
  maintenanceLabel,
}: {
  maintenanceId: string;
  maintenanceLabel: string;
}) {
  const emptyState: MaintenanceActionState = {};
  const [state, formAction] = useFormState(deleteMaintenanceAction, emptyState);

  return (
    <form action={formAction} className="rounded-xl border border-rose-200 bg-rose-50 p-6">
      <h2 className="text-lg font-semibold text-rose-900">Delete Maintenance Log</h2>
      <p className="mt-2 text-sm text-rose-800">
        This will perform a soft delete. The maintenance log will be removed from operational
        history.
      </p>
      <input type="hidden" name="maintenanceId" value={maintenanceId} />
      <div className="mt-4">
        <label className="text-sm font-medium text-rose-900" htmlFor="confirmLabel">
          Type the maintenance log label to confirm
        </label>
        <input
          id="confirmLabel"
          name="confirmLabel"
          type="text"
          placeholder={maintenanceLabel}
          className="mt-1 w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-rose-400 focus:outline-none"
          required
          pattern={maintenanceLabel}
        />
      </div>
      {state.error ? <p className="mt-2 text-sm text-rose-700">{state.error}</p> : null}
      <button
        type="submit"
        className="mt-4 inline-flex items-center justify-center rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500"
      >
        Delete Maintenance Log
      </button>
    </form>
  );
}
