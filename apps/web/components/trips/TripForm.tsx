"use client";

import { useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

import { TripActionState } from "@/app/(protected)/trips/actions";
import { TripFieldErrors, TripFormValues } from "@/lib/trips/types";
import { normalizeTripInput, validateTripInput } from "@/lib/trips/validation";

type BranchOption = { id: string; name: string };

type DriverOption = { id: string; full_name: string; branch_id: string };

type VehicleOption = { id: string; registration_number: string; branch_id: string };

type TripFormProps = {
  title: string;
  action: (prevState: TripActionState, formData: FormData) => Promise<TripActionState>;
  submitLabel: string;
  branches: BranchOption[];
  drivers: DriverOption[];
  vehicles: VehicleOption[];
  initialValues?: Partial<TripFormValues>;
  tripId?: string;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Saving..." : label}
    </button>
  );
}

export default function TripForm({
  title,
  action,
  submitLabel,
  branches,
  drivers,
  vehicles,
  initialValues,
  tripId,
}: TripFormProps) {
  const emptyState: TripActionState = {};
  const [state, formAction] = useFormState(action, emptyState);
  const [values, setValues] = useState<TripFormValues>({
    branchId: initialValues?.branchId ?? "",
    driverId: initialValues?.driverId ?? "",
    vehicleId: initialValues?.vehicleId ?? "",
    tripCode: initialValues?.tripCode ?? "",
    customerName: initialValues?.customerName ?? "",
    customerPhone: initialValues?.customerPhone ?? "",
    pickupLocation: initialValues?.pickupLocation ?? "",
    dropoffLocation: initialValues?.dropoffLocation ?? "",
    scheduledStartAt: initialValues?.scheduledStartAt ?? "",
    scheduledEndAt: initialValues?.scheduledEndAt ?? "",
    actualStartAt: initialValues?.actualStartAt ?? "",
    actualEndAt: initialValues?.actualEndAt ?? "",
    distanceKm: initialValues?.distanceKm ?? "",
    fareAmount: initialValues?.fareAmount ?? "",
    status: (initialValues?.status ?? "SCHEDULED") as TripFormValues["status"],
    notes: initialValues?.notes ?? "",
  });
  const [clientErrors, setClientErrors] = useState<TripFieldErrors>({});

  const fieldErrors = useMemo(
    () => ({
      ...clientErrors,
      ...state.fieldErrors,
    }),
    [clientErrors, state.fieldErrors],
  );

  const updateValue =
    (key: keyof TripFormValues) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      setValues((prev) => ({
        ...prev,
        [key]: key === "tripCode" ? value.toUpperCase() : value,
      }));
    };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const normalized = normalizeTripInput(values);
    const errors = validateTripInput(normalized);
    setClientErrors(errors);

    if (Object.keys(errors).length > 0) {
      event.preventDefault();
    }
  };

  const filteredDrivers = values.branchId
    ? drivers.filter((driver) => driver.branch_id === values.branchId)
    : drivers;
  const filteredVehicles = values.branchId
    ? vehicles.filter((vehicle) => vehicle.branch_id === values.branchId)
    : vehicles;

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Trips</p>
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="branchId">
            Branch
          </label>
          <select
            id="branchId"
            name="branchId"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            value={values.branchId}
            onChange={updateValue("branchId")}
            required
          >
            <option value="">Select branch</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
          {fieldErrors.branchId ? (
            <p className="mt-1 text-xs text-rose-600">{fieldErrors.branchId}</p>
          ) : null}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="tripCode">
            Trip Code
          </label>
          <input
            id="tripCode"
            name="tripCode"
            type="text"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            value={values.tripCode}
            onChange={updateValue("tripCode")}
            required
          />
          {fieldErrors.tripCode ? (
            <p className="mt-1 text-xs text-rose-600">{fieldErrors.tripCode}</p>
          ) : null}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="driverId">
            Driver
          </label>
          <select
            id="driverId"
            name="driverId"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            value={values.driverId}
            onChange={updateValue("driverId")}
            required
          >
            <option value="">Select driver</option>
            {filteredDrivers.map((driver) => (
              <option key={driver.id} value={driver.id}>
                {driver.full_name}
              </option>
            ))}
          </select>
          {fieldErrors.driverId ? (
            <p className="mt-1 text-xs text-rose-600">{fieldErrors.driverId}</p>
          ) : null}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="vehicleId">
            Vehicle
          </label>
          <select
            id="vehicleId"
            name="vehicleId"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            value={values.vehicleId}
            onChange={updateValue("vehicleId")}
            required
          >
            <option value="">Select vehicle</option>
            {filteredVehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.registration_number}
              </option>
            ))}
          </select>
          {fieldErrors.vehicleId ? (
            <p className="mt-1 text-xs text-rose-600">{fieldErrors.vehicleId}</p>
          ) : null}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="pickupLocation">
            Pickup Location
          </label>
          <input
            id="pickupLocation"
            name="pickupLocation"
            type="text"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            value={values.pickupLocation}
            onChange={updateValue("pickupLocation")}
            required
          />
          {fieldErrors.pickupLocation ? (
            <p className="mt-1 text-xs text-rose-600">{fieldErrors.pickupLocation}</p>
          ) : null}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="dropoffLocation">
            Dropoff Location
          </label>
          <input
            id="dropoffLocation"
            name="dropoffLocation"
            type="text"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            value={values.dropoffLocation}
            onChange={updateValue("dropoffLocation")}
            required
          />
          {fieldErrors.dropoffLocation ? (
            <p className="mt-1 text-xs text-rose-600">{fieldErrors.dropoffLocation}</p>
          ) : null}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="scheduledStartAt">
            Scheduled Start
          </label>
          <input
            id="scheduledStartAt"
            name="scheduledStartAt"
            type="datetime-local"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            value={values.scheduledStartAt}
            onChange={updateValue("scheduledStartAt")}
            required
          />
          {fieldErrors.scheduledStartAt ? (
            <p className="mt-1 text-xs text-rose-600">{fieldErrors.scheduledStartAt}</p>
          ) : null}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="scheduledEndAt">
            Scheduled End
          </label>
          <input
            id="scheduledEndAt"
            name="scheduledEndAt"
            type="datetime-local"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            value={values.scheduledEndAt}
            onChange={updateValue("scheduledEndAt")}
          />
          {fieldErrors.scheduledEndAt ? (
            <p className="mt-1 text-xs text-rose-600">{fieldErrors.scheduledEndAt}</p>
          ) : null}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="customerName">
            Customer Name
          </label>
          <input
            id="customerName"
            name="customerName"
            type="text"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            value={values.customerName}
            onChange={updateValue("customerName")}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="customerPhone">
            Customer Phone
          </label>
          <input
            id="customerPhone"
            name="customerPhone"
            type="text"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            value={values.customerPhone}
            onChange={updateValue("customerPhone")}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="distanceKm">
            Distance (km)
          </label>
          <input
            id="distanceKm"
            name="distanceKm"
            type="number"
            min={0}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            value={values.distanceKm}
            onChange={updateValue("distanceKm")}
          />
          {fieldErrors.distanceKm ? (
            <p className="mt-1 text-xs text-rose-600">{fieldErrors.distanceKm}</p>
          ) : null}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="fareAmount">
            Fare Amount
          </label>
          <input
            id="fareAmount"
            name="fareAmount"
            type="number"
            min={0}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            value={values.fareAmount}
            onChange={updateValue("fareAmount")}
          />
          {fieldErrors.fareAmount ? (
            <p className="mt-1 text-xs text-rose-600">{fieldErrors.fareAmount}</p>
          ) : null}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="status">
            Status
          </label>
          <select
            id="status"
            name="status"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            value={values.status}
            onChange={updateValue("status")}
            required
          >
            <option value="SCHEDULED">Scheduled</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="notes">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            className="mt-1 min-h-[120px] w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            value={values.notes}
            onChange={updateValue("notes")}
          />
        </div>
      </div>

      {tripId ? <input type="hidden" name="tripId" value={tripId} /> : null}
      <input type="hidden" name="actualStartAt" value={values.actualStartAt} />
      <input type="hidden" name="actualEndAt" value={values.actualEndAt} />

      {state.error ? <p className="text-sm text-rose-600">{state.error}</p> : null}

      <div className="flex items-center gap-3">
        <SubmitButton label={submitLabel} />
        <a className="text-sm font-semibold text-slate-600 hover:text-slate-900" href="/trips">
          Cancel
        </a>
      </div>
    </form>
  );
}
