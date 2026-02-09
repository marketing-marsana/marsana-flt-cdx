"use client";

import { useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

import { VehicleActionState } from "@/app/(protected)/vehicles/actions";
import { VehicleFieldErrors, VehicleFormValues } from "@/lib/vehicles/types";
import { normalizeVehicleInput, validateVehicleInput } from "@/lib/vehicles/validation";

type BranchOption = {
  id: string;
  name: string;
};

type VehicleFormProps = {
  title: string;
  action: (prevState: VehicleActionState, formData: FormData) => Promise<VehicleActionState>;
  submitLabel: string;
  branches: BranchOption[];
  initialValues?: Partial<VehicleFormValues>;
  vehicleId?: string;
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

export default function VehicleForm({
  title,
  action,
  submitLabel,
  branches,
  initialValues,
  vehicleId,
}: VehicleFormProps) {
  const emptyState: VehicleActionState = {};
  const [state, formAction] = useFormState(action, emptyState);
  const [values, setValues] = useState<VehicleFormValues>({
    branchId: initialValues?.branchId ?? "",
    registrationNumber: initialValues?.registrationNumber ?? "",
    make: initialValues?.make ?? "",
    model: initialValues?.model ?? "",
    year: initialValues?.year ?? "",
    color: initialValues?.color ?? "",
    vin: initialValues?.vin ?? "",
    fuelType: initialValues?.fuelType ?? "",
    odometer: initialValues?.odometer ?? "0",
    status: (initialValues?.status ?? "ACTIVE") as VehicleFormValues["status"],
    notes: initialValues?.notes ?? "",
  });
  const [clientErrors, setClientErrors] = useState<VehicleFieldErrors>({});

  const fieldErrors = useMemo(
    () => ({
      ...clientErrors,
      ...state.fieldErrors,
    }),
    [clientErrors, state.fieldErrors],
  );

  const updateValue =
    (key: keyof VehicleFormValues) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      setValues((prev) => ({
        ...prev,
        [key]: key === "registrationNumber" || key === "vin" ? value.toUpperCase() : value,
      }));
    };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const normalized = normalizeVehicleInput(values);
    const errors = validateVehicleInput(normalized);
    setClientErrors(errors);

    if (Object.keys(errors).length > 0) {
      event.preventDefault();
    }
  };

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Vehicles</p>
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="branchId">
            Branch Assignment
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
          <label className="text-sm font-medium text-slate-700" htmlFor="registrationNumber">
            Registration Number
          </label>
          <input
            id="registrationNumber"
            name="registrationNumber"
            type="text"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            value={values.registrationNumber}
            onChange={updateValue("registrationNumber")}
            required
          />
          {fieldErrors.registrationNumber ? (
            <p className="mt-1 text-xs text-rose-600">{fieldErrors.registrationNumber}</p>
          ) : null}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="make">
            Make
          </label>
          <input
            id="make"
            name="make"
            type="text"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            value={values.make}
            onChange={updateValue("make")}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="model">
            Model
          </label>
          <input
            id="model"
            name="model"
            type="text"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            value={values.model}
            onChange={updateValue("model")}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="year">
            Year
          </label>
          <input
            id="year"
            name="year"
            type="number"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            value={values.year}
            onChange={updateValue("year")}
          />
          {fieldErrors.year ? (
            <p className="mt-1 text-xs text-rose-600">{fieldErrors.year}</p>
          ) : null}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="color">
            Color
          </label>
          <input
            id="color"
            name="color"
            type="text"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            value={values.color}
            onChange={updateValue("color")}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="vin">
            VIN
          </label>
          <input
            id="vin"
            name="vin"
            type="text"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            value={values.vin}
            onChange={updateValue("vin")}
          />
          {fieldErrors.vin ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.vin}</p> : null}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="fuelType">
            Fuel Type
          </label>
          <input
            id="fuelType"
            name="fuelType"
            type="text"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            value={values.fuelType}
            onChange={updateValue("fuelType")}
          />
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
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="MAINTENANCE">Maintenance</option>
          </select>
          {fieldErrors.status ? (
            <p className="mt-1 text-xs text-rose-600">{fieldErrors.status}</p>
          ) : null}
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

      {vehicleId ? <input type="hidden" name="vehicleId" value={vehicleId} /> : null}

      {state.error ? <p className="text-sm text-rose-600">{state.error}</p> : null}

      <div className="flex items-center gap-3">
        <SubmitButton label={submitLabel} />
        <a className="text-sm font-semibold text-slate-600 hover:text-slate-900" href="/vehicles">
          Cancel
        </a>
      </div>
    </form>
  );
}
