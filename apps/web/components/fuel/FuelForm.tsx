"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

import { FuelActionState } from "@/app/(protected)/fuel/actions";
import { FuelFieldErrors, FuelFormValues } from "@/lib/fuel/types";
import { calculateTotalAmount, normalizeFuelInput, validateFuelInput } from "@/lib/fuel/validation";

type BranchOption = { id: string; name: string };
type VehicleOption = { id: string; registration_number: string; branch_id: string };
type TripOption = { id: string; trip_code: string; branch_id: string; vehicle_id: string };

type FuelFormProps = {
  title: string;
  action: (prevState: FuelActionState, formData: FormData) => Promise<FuelActionState>;
  submitLabel: string;
  branches: BranchOption[];
  vehicles: VehicleOption[];
  trips: TripOption[];
  initialValues?: Partial<FuelFormValues>;
  fuelId?: string;
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

export default function FuelForm({
  title,
  action,
  submitLabel,
  branches,
  vehicles,
  trips,
  initialValues,
  fuelId,
}: FuelFormProps) {
  const emptyState: FuelActionState = {};
  const [state, formAction] = useFormState(action, emptyState);
  const [values, setValues] = useState<FuelFormValues>({
    branchId: initialValues?.branchId ?? "",
    vehicleId: initialValues?.vehicleId ?? "",
    tripId: initialValues?.tripId ?? "",
    filledAt: initialValues?.filledAt ?? "",
    quantityLiters: initialValues?.quantityLiters ?? "",
    pricePerLiter: initialValues?.pricePerLiter ?? "",
    totalAmount: initialValues?.totalAmount ?? "",
    odometer: initialValues?.odometer ?? "",
    fuelStation: initialValues?.fuelStation ?? "",
    notes: initialValues?.notes ?? "",
  });
  const [clientErrors, setClientErrors] = useState<FuelFieldErrors>({});

  useEffect(() => {
    const total = calculateTotalAmount(values.quantityLiters, values.pricePerLiter);
    setValues((prev) => ({
      ...prev,
      totalAmount: total ? total.toFixed(2) : prev.totalAmount ? prev.totalAmount : "",
    }));
  }, [values.quantityLiters, values.pricePerLiter]);

  const fieldErrors = useMemo(
    () => ({
      ...clientErrors,
      ...state.fieldErrors,
    }),
    [clientErrors, state.fieldErrors],
  );

  const updateValue =
    (key: keyof FuelFormValues) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      setValues((prev) => ({
        ...prev,
        [key]: value,
      }));
    };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const normalized = normalizeFuelInput(values);
    const errors = validateFuelInput(normalized);
    setClientErrors(errors);

    if (Object.keys(errors).length > 0) {
      event.preventDefault();
    }
  };

  const filteredVehicles = values.branchId
    ? vehicles.filter((vehicle) => vehicle.branch_id === values.branchId)
    : vehicles;
  const filteredTrips = trips.filter((trip) => {
    if (values.branchId && trip.branch_id !== values.branchId) {
      return false;
    }
    if (values.vehicleId && trip.vehicle_id !== values.vehicleId) {
      return false;
    }
    return true;
  });

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Fuel Logs</p>
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
          <label className="text-sm font-medium text-slate-700" htmlFor="tripId">
            Trip (optional)
          </label>
          <select
            id="tripId"
            name="tripId"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            value={values.tripId}
            onChange={updateValue("tripId")}
          >
            <option value="">No trip linked</option>
            {filteredTrips.map((trip) => (
              <option key={trip.id} value={trip.id}>
                {trip.trip_code}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="filledAt">
            Filled At
          </label>
          <input
            id="filledAt"
            name="filledAt"
            type="datetime-local"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            value={values.filledAt}
            onChange={updateValue("filledAt")}
            required
          />
          {fieldErrors.filledAt ? (
            <p className="mt-1 text-xs text-rose-600">{fieldErrors.filledAt}</p>
          ) : null}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="quantityLiters">
            Quantity (liters)
          </label>
          <input
            id="quantityLiters"
            name="quantityLiters"
            type="number"
            min={0}
            step="0.01"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            value={values.quantityLiters}
            onChange={updateValue("quantityLiters")}
            required
          />
          {fieldErrors.quantityLiters ? (
            <p className="mt-1 text-xs text-rose-600">{fieldErrors.quantityLiters}</p>
          ) : null}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="pricePerLiter">
            Price per liter
          </label>
          <input
            id="pricePerLiter"
            name="pricePerLiter"
            type="number"
            min={0}
            step="0.01"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            value={values.pricePerLiter}
            onChange={updateValue("pricePerLiter")}
            required
          />
          {fieldErrors.pricePerLiter ? (
            <p className="mt-1 text-xs text-rose-600">{fieldErrors.pricePerLiter}</p>
          ) : null}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="totalAmount">
            Total Amount
          </label>
          <input
            id="totalAmount"
            name="totalAmount"
            type="number"
            min={0}
            step="0.01"
            readOnly
            className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            value={values.totalAmount}
          />
          {fieldErrors.totalAmount ? (
            <p className="mt-1 text-xs text-rose-600">{fieldErrors.totalAmount}</p>
          ) : null}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="odometer">
            Odometer
          </label>
          <input
            id="odometer"
            name="odometer"
            type="number"
            min={0}
            step="1"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            value={values.odometer}
            onChange={updateValue("odometer")}
            required
          />
          {fieldErrors.odometer ? (
            <p className="mt-1 text-xs text-rose-600">{fieldErrors.odometer}</p>
          ) : null}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="fuelStation">
            Fuel Station
          </label>
          <input
            id="fuelStation"
            name="fuelStation"
            type="text"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            value={values.fuelStation}
            onChange={updateValue("fuelStation")}
          />
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

      {fuelId ? <input type="hidden" name="fuelId" value={fuelId} /> : null}

      {state.error ? <p className="text-sm text-rose-600">{state.error}</p> : null}

      <div className="flex items-center gap-3">
        <SubmitButton label={submitLabel} />
        <a className="text-sm font-semibold text-slate-600 hover:text-slate-900" href="/fuel">
          Cancel
        </a>
      </div>
    </form>
  );
}
