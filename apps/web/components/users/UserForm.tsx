"use client";

import { useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

import { UserActionState } from "@/app/(protected)/users/actions";
import { DEFAULT_PERMISSIONS } from "@/lib/users/permissions";
import { PermissionRow, UserFieldErrors, UserFormValues } from "@/lib/users/types";
import { normalizeUserInput, validateUserInput } from "@/lib/users/validation";

type BranchOption = {
  id: string;
  name: string;
};

type UserFormProps = {
  title: string;
  action: (prevState: UserActionState, formData: FormData) => Promise<UserActionState>;
  submitLabel: string;
  branches: BranchOption[];
  initialValues?: Partial<UserFormValues>;
  userId?: string;
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

function PermissionToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}

export default function UserForm({
  title,
  action,
  submitLabel,
  branches,
  initialValues,
  userId,
}: UserFormProps) {
  const emptyState: UserActionState = {};
  const [state, formAction] = useFormState(action, emptyState);
  const [values, setValues] = useState<UserFormValues>({
    fullName: initialValues?.fullName ?? "",
    email: initialValues?.email ?? "",
    phone: initialValues?.phone ?? "",
    branchId: initialValues?.branchId ?? "",
    designation: initialValues?.designation ?? "",
    status: (initialValues?.status ?? "ACTIVE") as UserFormValues["status"],
    password: "",
    resetPassword: false,
    isSuperAdmin: Boolean(initialValues?.isSuperAdmin),
    permissions: initialValues?.permissions ?? DEFAULT_PERMISSIONS,
  });
  const [clientErrors, setClientErrors] = useState<UserFieldErrors>({});

  const fieldErrors = useMemo(
    () => ({
      ...clientErrors,
      ...state.fieldErrors,
    }),
    [clientErrors, state.fieldErrors],
  );

  const updateValue =
    (key: keyof UserFormValues) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
      setValues((prev) => ({
        ...prev,
        [key]: value,
      }));
    };

  const updatePermission = (module: string, key: keyof PermissionRow) => (next: boolean) => {
    setValues((prev) => ({
      ...prev,
      permissions: prev.permissions.map((permission) =>
        permission.module === module
          ? {
              ...permission,
              [key]: next,
              ...(key !== "can_view" && next ? { can_view: true } : null),
            }
          : permission,
      ),
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const normalized = normalizeUserInput(values);
    const errors = validateUserInput(normalized, userId ? "edit" : "create");
    setClientErrors(errors);

    if (Object.keys(errors).length > 0) {
      event.preventDefault();
    }
  };

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Users</p>
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
          <label className="text-sm font-medium text-slate-700" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            value={values.email}
            onChange={updateValue("email")}
            required
          />
          {fieldErrors.email ? (
            <p className="mt-1 text-xs text-rose-600">{fieldErrors.email}</p>
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
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="designation">
            Designation
          </label>
          <input
            id="designation"
            name="designation"
            type="text"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            value={values.designation}
            onChange={updateValue("designation")}
          />
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
            disabled={values.isSuperAdmin}
            required={!values.isSuperAdmin}
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
          <label className="text-sm font-medium text-slate-700" htmlFor="status">
            Status
          </label>
          <select
            id="status"
            name="status"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            value={values.status}
            onChange={updateValue("status")}
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              name="isSuperAdmin"
              checked={values.isSuperAdmin}
              onChange={updateValue("isSuperAdmin")}
            />
            Super Admin
          </label>
        </div>

        <div className="sm:col-span-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="password">
            {userId ? "Reset Password" : "Password"}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            value={values.password}
            onChange={updateValue("password")}
            required={!userId}
          />
          {userId ? (
            <label className="mt-2 flex items-center gap-2 text-xs font-medium text-slate-600">
              <input
                type="checkbox"
                name="resetPassword"
                checked={values.resetPassword}
                onChange={updateValue("resetPassword")}
              />
              Apply new password on save
            </label>
          ) : null}
          {fieldErrors.password ? (
            <p className="mt-1 text-xs text-rose-600">{fieldErrors.password}</p>
          ) : null}
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Permission Matrix</h2>
            <p className="mt-1 text-sm text-slate-600">
              Grant per-module permissions. At least one view permission is required.
            </p>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Module</th>
                <th className="px-4 py-3">View</th>
                <th className="px-4 py-3">Create</th>
                <th className="px-4 py-3">Edit</th>
                <th className="px-4 py-3">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {values.permissions.map((permission) => (
                <tr key={permission.module}>
                  <td className="px-4 py-3 font-semibold text-slate-900">{permission.module}</td>
                  <td className="px-4 py-3">
                    <PermissionToggle
                      label="View"
                      checked={permission.can_view}
                      onChange={updatePermission(permission.module, "can_view")}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <PermissionToggle
                      label="Create"
                      checked={permission.can_create}
                      onChange={updatePermission(permission.module, "can_create")}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <PermissionToggle
                      label="Edit"
                      checked={permission.can_edit}
                      onChange={updatePermission(permission.module, "can_edit")}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <PermissionToggle
                      label="Delete"
                      checked={permission.can_delete}
                      onChange={updatePermission(permission.module, "can_delete")}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {fieldErrors.permissions ? (
          <p className="mt-2 text-xs text-rose-600">{fieldErrors.permissions}</p>
        ) : null}
      </section>

      {userId ? <input type="hidden" name="userId" value={userId} /> : null}
      <input type="hidden" name="permissions" value={JSON.stringify(values.permissions)} />

      {state.error ? <p className="text-sm text-rose-600">{state.error}</p> : null}

      <div className="flex items-center gap-3">
        <SubmitButton label={submitLabel} />
        <a className="text-sm font-semibold text-slate-600 hover:text-slate-900" href="/users">
          Cancel
        </a>
      </div>
    </form>
  );
}
