"use client";

import { useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

import { DriverActionState } from "@/app/(protected)/drivers/actions";
import { DriverFieldErrors, DriverFormValues } from "@/lib/drivers/types";
import { normalizeDriverInput, validateDriverInput } from "@/lib/drivers/validation";

type BranchOption = {
  id: string;
  name: string;
};

type DriverFormProps = {
  title: string;
  action: (prevState: DriverActionState, formData: FormData) => Promise<DriverActionState>;
  submitLabel: string;
  branches: BranchOption[];
  initialValues?: Partial<DriverFormValues>;
  driverId?: string;
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

export default function DriverForm({
  title,
  action,
  submitLabel,
  branches,
  initialValues,
  driverId,
}: DriverFormProps) {
  const emptyState: DriverActionState = {};
  const [state, formAction] = useFormState(action, emptyState);
  const [values, setValues] = useState<DriverFormValues>({
    branchId: initialValues?.branchId ?? "",
    fullName: initialValues?.fullName ?? "",
    phone: initialValues?.phone ?? "",
    licenseNumber: initialValues?.licenseNumber ?? "",
    licenseExpiryDate: initialValues?.licenseExpiryDate ?? "",
    status: (initialValues?.status ?? "ACTIVE") as DriverFormValues["status"],
    notes: initialValues?.notes ?? "",
  });
  const [clientErrors, setClientErrors] = useState<DriverFieldErrors>({});

  const fieldErrors = useMemo(
    () => ({
      ...clientErrors,
      ...state.fieldErrors,
    }),
    [clientErrors, state.fieldErrors],
  );

  const updateValue =
    (key: keyof DriverFormValues) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      setValues((prev) => ({
        ...prev,
        [key]: key === "licenseNumber" ? value.toUpperCase() : value,
      }));
    };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const normalized = normalizeDriverInput(values);
    const errors = validateDriverInput(normalized);
    setClientErrors(errors);

    if (Object.keys(errors).length > 0) {
      event.preventDefault();
    }
  };

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Drivers</p>
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="fullName">
            Full Name
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            value={values.fullName}
            onChange={updateValue("fullName")}
            required
          />
          {fieldErrors.fullName ? (
            <p className="mt-1 text-xs text-rose-600">{fieldErrors.fullName}</p>
          ) : null}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="phone">
            Phone
          </label>
          <input
            id="phone"
            name="phone"
            type="text"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            value={values.phone}
            onChange={updateValue("phone")}
            required
          />
          {fieldErrors.phone ? (
            <p className="mt-1 text-xs text-rose-600">{fieldErrors.phone}</p>
          ) : null}
        </div>

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
          <label className="text-sm font-medium text-slate-700" htmlFor="licenseNumber">
            License Number
          </label>
          <input
            id="licenseNumber"
            name="licenseNumber"
            type="text"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            value={values.licenseNumber}
            onChange={updateValue("licenseNumber")}
            required
          />
          {fieldErrors.licenseNumber ? (
            <p className="mt-1 text-xs text-rose-600">{fieldErrors.licenseNumber}</p>
          ) : null}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="licenseExpiryDate">
            License Expiry Date
          </label>
          <input
            id="licenseExpiryDate"
            name="licenseExpiryDate"
            type="date"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            value={values.licenseExpiryDate}
            onChange={updateValue("licenseExpiryDate")}
          />
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

      {driverId ? <input type="hidden" name="driverId" value={driverId} /> : null}

      {state.error ? <p className="text-sm text-rose-600">{state.error}</p> : null}

      <div className="flex items-center gap-3">
        <SubmitButton label={submitLabel} />
        <a className="text-sm font-semibold text-slate-600 hover:text-slate-900" href="/drivers">
          Cancel
        </a>
      </div>
    </form>
  );
}
