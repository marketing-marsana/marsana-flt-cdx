"use client";

import { useFormState } from "react-dom";

import { VehicleActionState, deleteVehicleAction } from "@/app/(protected)/vehicles/actions";

export default function VehicleDeleteForm({
  vehicleId,
  registrationNumber,
}: {
  vehicleId: string;
  registrationNumber: string;
}) {
  const emptyState: VehicleActionState = {};
  const [state, formAction] = useFormState(deleteVehicleAction, emptyState);

  return (
    <form action={formAction} className="rounded-xl border border-rose-200 bg-rose-50 p-6">
      <h2 className="text-lg font-semibold text-rose-900">Delete Vehicle</h2>
      <p className="mt-2 text-sm text-rose-800">
        This will perform a soft delete. The vehicle will no longer appear in active lists.
      </p>
      <input type="hidden" name="vehicleId" value={vehicleId} />
      <div className="mt-4">
        <label className="text-sm font-medium text-rose-900" htmlFor="confirmValue">
          Type the registration number to confirm
        </label>
        <input
          id="confirmValue"
          name="confirmValue"
          type="text"
          placeholder={registrationNumber}
          className="mt-1 w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-rose-400 focus:outline-none"
          required
          pattern={registrationNumber}
        />
      </div>
      {state.error ? <p className="mt-2 text-sm text-rose-700">{state.error}</p> : null}
      <button
        type="submit"
        className="mt-4 inline-flex items-center justify-center rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500"
      >
        Delete Vehicle
      </button>
    </form>
  );
}
