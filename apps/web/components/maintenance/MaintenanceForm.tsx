"use client";

import { useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

import { MaintenanceActionState } from "@/app/(protected)/maintenance/actions";
import { MaintenanceFieldErrors, MaintenanceFormValues } from "@/lib/maintenance/types";
import { normalizeMaintenanceInput, validateMaintenanceInput } from "@/lib/maintenance/validation";

type BranchOption = { id: string; name: string };
type VehicleOption = { id: string; registration_number: string; branch_id: string };
type TripOption = { id: string; trip_code: string; branch_id: string; vehicle_id: string };

type MaintenanceFormProps = {
  title: string;
  action: (
    prevState: MaintenanceActionState,
    formData: FormData,
  ) => Promise<MaintenanceActionState>;
  submitLabel: string;
  branches: BranchOption[];
  vehicles: VehicleOption[];
  trips: TripOption[];
  initialValues?: Partial<MaintenanceFormValues>;
  maintenanceId?: string;
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

export default function MaintenanceForm({
  title,
  action,
  submitLabel,
  branches,
  vehicles,
  trips,
  initialValues,
  maintenanceId,
}: MaintenanceFormProps) {
  const emptyState: MaintenanceActionState = {};
  const [state, formAction] = useFormState(action, emptyState);
  const [values, setValues] = useState<MaintenanceFormValues>({
    branchId: initialValues?.branchId ?? "",
    vehicleId: initialValues?.vehicleId ?? "",
    tripId: initialValues?.tripId ?? "",
    serviceDate: initialValues?.serviceDate ?? "",
    maintenanceType: (initialValues?.maintenanceType ??
      "service") as MaintenanceFormValues["maintenanceType"],
    description: initialValues?.description ?? "",
    vendorOrWorkshop: initialValues?.vendorOrWorkshop ?? "",
    costAmount: initialValues?.costAmount ?? "",
    odometer: initialValues?.odometer ?? "",
    nextServiceOdometer: initialValues?.nextServiceOdometer ?? "",
    nextServiceDate: initialValues?.nextServiceDate ?? "",
    notes: initialValues?.notes ?? "",
  });
  const [clientErrors, setClientErrors] = useState<MaintenanceFieldErrors>({});

  const fieldErrors = useMemo(
    () => ({
      ...clientErrors,
      ...state.fieldErrors,
    }),
    [clientErrors, state.fieldErrors],
  );

  const updateValue =
    (key: keyof MaintenanceFormValues) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      setValues((prev) => ({
        ...prev,
        [key]: value,
      }));
    };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const normalized = normalizeMaintenanceInput(values);
    const errors = validateMaintenanceInput(normalized);
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
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Maintenance</p>
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
          <label className="text-sm font-medium text-slate-700" htmlFor="serviceDate">
            Service Date
          </label>
          <input
            id="serviceDate"
            name="serviceDate"
            type="datetime-local"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            value={values.serviceDate}
            onChange={updateValue("serviceDate")}
            required
          />
          {fieldErrors.serviceDate ? (
            <p className="mt-1 text-xs text-rose-600">{fieldErrors.serviceDate}</p>
          ) : null}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="maintenanceType">
            Maintenance Type
          </label>
          <select
            id="maintenanceType"
            name="maintenanceType"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            value={values.maintenanceType}
            onChange={updateValue("maintenanceType")}
            required
          >
            <option value="service">Service</option>
            <option value="repair">Repair</option>
            <option value="parts">Parts</option>
            <option value="inspection">Inspection</option>
            <option value="other">Other</option>
          </select>
          {fieldErrors.maintenanceType ? (
            <p className="mt-1 text-xs text-rose-600">{fieldErrors.maintenanceType}</p>
          ) : null}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="description">
            Description
          </label>
          <input
            id="description"
            name="description"
            type="text"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            value={values.description}
            onChange={updateValue("description")}
            required
          />
          {fieldErrors.description ? (
            <p className="mt-1 text-xs text-rose-600">{fieldErrors.description}</p>
          ) : null}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="vendorOrWorkshop">
            Vendor / Workshop
          </label>
          <input
            id="vendorOrWorkshop"
            name="vendorOrWorkshop"
            type="text"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            value={values.vendorOrWorkshop}
            onChange={updateValue("vendorOrWorkshop")}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="costAmount">
            Cost Amount
          </label>
          <input
            id="costAmount"
            name="costAmount"
            type="number"
            min={0}
            step="0.01"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            value={values.costAmount}
            onChange={updateValue("costAmount")}
            required
          />
          {fieldErrors.costAmount ? (
            <p className="mt-1 text-xs text-rose-600">{fieldErrors.costAmount}</p>
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
          <label className="text-sm font-medium text-slate-700" htmlFor="nextServiceOdometer">
            Next Service Odometer
          </label>
          <input
            id="nextServiceOdometer"
            name="nextServiceOdometer"
            type="number"
            min={0}
            step="1"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            value={values.nextServiceOdometer}
            onChange={updateValue("nextServiceOdometer")}
          />
          {fieldErrors.nextServiceOdometer ? (
            <p className="mt-1 text-xs text-rose-600">{fieldErrors.nextServiceOdometer}</p>
          ) : null}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="nextServiceDate">
            Next Service Date
          </label>
          <input
            id="nextServiceDate"
            name="nextServiceDate"
            type="date"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            value={values.nextServiceDate}
            onChange={updateValue("nextServiceDate")}
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

      {maintenanceId ? <input type="hidden" name="maintenanceId" value={maintenanceId} /> : null}

      {state.error ? <p className="text-sm text-rose-600">{state.error}</p> : null}

      <div className="flex items-center gap-3">
        <SubmitButton label={submitLabel} />
        <a
          className="text-sm font-semibold text-slate-600 hover:text-slate-900"
          href="/maintenance"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
