"use client";

import { useFormState } from "react-dom";

import { TripActionState, deleteTripAction } from "@/app/(protected)/trips/actions";

export default function TripDeleteForm({ tripId, tripCode }: { tripId: string; tripCode: string }) {
  const emptyState: TripActionState = {};
  const [state, formAction] = useFormState(deleteTripAction, emptyState);

  return (
    <form action={formAction} className="rounded-xl border border-rose-200 bg-rose-50 p-6">
      <h2 className="text-lg font-semibold text-rose-900">Delete Trip</h2>
      <p className="mt-2 text-sm text-rose-800">
        This will perform a soft delete. The trip will no longer appear in operational workflows.
      </p>
      <input type="hidden" name="tripId" value={tripId} />
      <div className="mt-4">
        <label className="text-sm font-medium text-rose-900" htmlFor="confirmCode">
          Type the trip code to confirm
        </label>
        <input
          id="confirmCode"
          name="confirmCode"
          type="text"
          placeholder={tripCode}
          className="mt-1 w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-rose-400 focus:outline-none"
          required
          pattern={tripCode}
        />
      </div>
      {state.error ? <p className="mt-2 text-sm text-rose-700">{state.error}</p> : null}
      <button
        type="submit"
        className="mt-4 inline-flex items-center justify-center rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500"
      >
        Delete Trip
      </button>
    </form>
  );
}
