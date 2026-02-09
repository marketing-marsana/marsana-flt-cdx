"use client";

import { useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

import { BranchActionState } from "@/app/(protected)/branches/actions";
import { BranchFieldErrors, BranchFormValues } from "@/lib/branches/types";
import { normalizeBranchInput, validateBranchInput } from "@/lib/branches/validation";

type BranchFormProps = {
  title: string;
  action: (prevState: BranchActionState, formData: FormData) => Promise<BranchActionState>;
  submitLabel: string;
  initialValues?: Partial<BranchFormValues>;
  branchId?: string;
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

export default function BranchForm({
  title,
  action,
  submitLabel,
  initialValues,
  branchId,
}: BranchFormProps) {
  const emptyState: BranchActionState = {};
  const [state, formAction] = useFormState(action, emptyState);
  const [values, setValues] = useState<BranchFormValues>({
    name: initialValues?.name ?? "",
    code: initialValues?.code ?? "",
    type: (initialValues?.type ?? "HQ") as BranchFormValues["type"],
    address: initialValues?.address ?? "",
    contactNumber: initialValues?.contactNumber ?? "",
    status: (initialValues?.status ?? "ACTIVE") as BranchFormValues["status"],
  });
  const [clientErrors, setClientErrors] = useState<BranchFieldErrors>({});

  const fieldErrors = useMemo(
    () => ({
      ...clientErrors,
      ...state.fieldErrors,
    }),
    [clientErrors, state.fieldErrors],
  );

  const handleChange =
    (key: keyof BranchFormValues) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = event.target.value;
      setValues((prev) => ({
        ...prev,
        [key]: key === "code" ? value.toUpperCase() : value,
      }));
    };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const normalized = normalizeBranchInput(values);
    const errors = validateBranchInput(normalized);
    setClientErrors(errors);

    if (Object.keys(errors).length > 0) {
      event.preventDefault();
    }
  };

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Branch</p>
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="name">
            Branch Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            value={values.name}
            onChange={handleChange("name")}
            required
          />
          {fieldErrors.name ? (
            <p className="mt-1 text-xs text-rose-600">{fieldErrors.name}</p>
          ) : null}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="code">
            Branch Code
          </label>
          <input
            id="code"
            name="code"
            type="text"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            value={values.code}
            onChange={handleChange("code")}
            required
          />
          {fieldErrors.code ? (
            <p className="mt-1 text-xs text-rose-600">{fieldErrors.code}</p>
          ) : null}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="type">
            Branch Type
          </label>
          <select
            id="type"
            name="type"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            value={values.type}
            onChange={handleChange("type")}
            required
          >
            <option value="HQ">HQ</option>
            <option value="B2B">B2B</option>
            <option value="B2C">B2C</option>
          </select>
          {fieldErrors.type ? (
            <p className="mt-1 text-xs text-rose-600">{fieldErrors.type}</p>
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
            onChange={handleChange("status")}
            required
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          {fieldErrors.status ? (
            <p className="mt-1 text-xs text-rose-600">{fieldErrors.status}</p>
          ) : null}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="contactNumber">
            Contact Number
          </label>
          <input
            id="contactNumber"
            name="contactNumber"
            type="text"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            value={values.contactNumber}
            onChange={handleChange("contactNumber")}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="address">
            Address
          </label>
          <input
            id="address"
            name="address"
            type="text"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            value={values.address}
            onChange={handleChange("address")}
          />
        </div>
      </div>

      {branchId ? <input type="hidden" name="branchId" value={branchId} /> : null}

      {state.error ? <p className="text-sm text-rose-600">{state.error}</p> : null}

      <div className="flex items-center gap-3">
        <SubmitButton label={submitLabel} />
        <a className="text-sm font-semibold text-slate-600 hover:text-slate-900" href="/branches">
          Cancel
        </a>
      </div>
    </form>
  );
}
