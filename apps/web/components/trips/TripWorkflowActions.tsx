"use client";

import { useFormState, useFormStatus } from "react-dom";

import {
  cancelTripAction,
  completeTripAction,
  startTripAction,
  TripActionState,
} from "@/app/(protected)/trips/actions";
import { TripStatus } from "@/lib/trips/types";

function ActionButton({ label, tone }: { label: string; tone: "primary" | "danger" }) {
  const { pending } = useFormStatus();
  const base =
    "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60";
  const classes =
    tone === "danger"
      ? "bg-rose-600 text-white hover:bg-rose-500"
      : "bg-slate-900 text-white hover:bg-slate-800";

  return (
    <button type="submit" disabled={pending} className={`${base} ${classes}`}>
      {pending ? "Working..." : label}
    </button>
  );
}

export default function TripWorkflowActions({
  tripId,
  status,
}: {
  tripId: string;
  status: TripStatus;
}) {
  const emptyState: TripActionState = {};
  const [startState, startAction] = useFormState(
    async (_prev: typeof emptyState, formData: FormData) => startTripAction(formData),
    emptyState,
  );
  const [completeState, completeAction] = useFormState(
    async (_prev: typeof emptyState, formData: FormData) => completeTripAction(formData),
    emptyState,
  );
  const [cancelState, cancelAction] = useFormState(
    async (_prev: typeof emptyState, formData: FormData) => cancelTripAction(formData),
    emptyState,
  );

  return (
    <div className="flex flex-col gap-3">
      {status === "SCHEDULED" ? (
        <div className="flex flex-wrap gap-3">
          <form action={startAction}>
            <input type="hidden" name="tripId" value={tripId} />
            <ActionButton label="Start Trip" tone="primary" />
          </form>
          <form action={cancelAction}>
            <input type="hidden" name="tripId" value={tripId} />
            <ActionButton label="Cancel Trip" tone="danger" />
          </form>
        </div>
      ) : null}
      {status === "IN_PROGRESS" ? (
        <form action={completeAction}>
          <input type="hidden" name="tripId" value={tripId} />
          <ActionButton label="Complete Trip" tone="primary" />
        </form>
      ) : null}

      {startState.error ? <p className="text-sm text-rose-600">{startState.error}</p> : null}
      {completeState.error ? <p className="text-sm text-rose-600">{completeState.error}</p> : null}
      {cancelState.error ? <p className="text-sm text-rose-600">{cancelState.error}</p> : null}
    </div>
  );
}
