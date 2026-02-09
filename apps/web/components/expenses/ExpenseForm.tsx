"use client";

import { useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

import { ExpenseActionState } from "@/app/(protected)/expenses/actions";
import { ExpenseFieldErrors, ExpenseFormValues } from "@/lib/expenses/types";
import { normalizeExpenseInput, validateExpenseInput } from "@/lib/expenses/validation";

type BranchOption = { id: string; name: string };
type VehicleOption = { id: string; registration_number: string; branch_id: string };
type TripOption = { id: string; trip_code: string; branch_id: string; vehicle_id: string };

type ExpenseFormProps = {
  title: string;
  action: (prevState: ExpenseActionState, formData: FormData) => Promise<ExpenseActionState>;
  submitLabel: string;
  branches: BranchOption[];
  vehicles: VehicleOption[];
  trips: TripOption[];
  initialValues?: Partial<ExpenseFormValues>;
  expenseId?: string;
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

export default function ExpenseForm({
  title,
  action,
  submitLabel,
  branches,
  vehicles,
  trips,
  initialValues,
  expenseId,
}: ExpenseFormProps) {
  const emptyState: ExpenseActionState = {};
  const [state, formAction] = useFormState(action, emptyState);
  const [values, setValues] = useState<ExpenseFormValues>({
    branchId: initialValues?.branchId ?? "",
    relatedVehicleId: initialValues?.relatedVehicleId ?? "",
    relatedTripId: initialValues?.relatedTripId ?? "",
    expenseDate: initialValues?.expenseDate ?? "",
    category: (initialValues?.category ?? "misc") as ExpenseFormValues["category"],
    description: initialValues?.description ?? "",
    amount: initialValues?.amount ?? "",
    paymentMethod: (initialValues?.paymentMethod ?? "cash") as ExpenseFormValues["paymentMethod"],
    notes: initialValues?.notes ?? "",
  });
  const [clientErrors, setClientErrors] = useState<ExpenseFieldErrors>({});

  const fieldErrors = useMemo(
    () => ({
      ...clientErrors,
      ...state.fieldErrors,
    }),
    [clientErrors, state.fieldErrors],
  );

  const updateValue =
    (key: keyof ExpenseFormValues) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      setValues((prev) => ({
        ...prev,
        [key]: value,
      }));
    };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const normalized = normalizeExpenseInput(values);
    const errors = validateExpenseInput(normalized);
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
    if (values.relatedVehicleId && trip.vehicle_id !== values.relatedVehicleId) {
      return false;
    }
    return true;
  });

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Expenses</p>
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
          <label className="text-sm font-medium text-slate-700" htmlFor="relatedVehicleId">
            Related Vehicle (optional)
          </label>
          <select
            id="relatedVehicleId"
            name="relatedVehicleId"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            value={values.relatedVehicleId}
            onChange={updateValue("relatedVehicleId")}
          >
            <option value="">No vehicle linked</option>
            {filteredVehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.registration_number}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="relatedTripId">
            Related Trip (optional)
          </label>
          <select
            id="relatedTripId"
            name="relatedTripId"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            value={values.relatedTripId}
            onChange={updateValue("relatedTripId")}
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
          <label className="text-sm font-medium text-slate-700" htmlFor="expenseDate">
            Expense Date
          </label>
          <input
            id="expenseDate"
            name="expenseDate"
            type="datetime-local"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            value={values.expenseDate}
            onChange={updateValue("expenseDate")}
            required
          />
          {fieldErrors.expenseDate ? (
            <p className="mt-1 text-xs text-rose-600">{fieldErrors.expenseDate}</p>
          ) : null}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="category">
            Category
          </label>
          <select
            id="category"
            name="category"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            value={values.category}
            onChange={updateValue("category")}
            required
          >
            <option value="toll">Toll</option>
            <option value="parking">Parking</option>
            <option value="petty_cash">Petty cash</option>
            <option value="misc">Misc</option>
            <option value="other">Other</option>
          </select>
          {fieldErrors.category ? (
            <p className="mt-1 text-xs text-rose-600">{fieldErrors.category}</p>
          ) : null}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="paymentMethod">
            Payment Method
          </label>
          <select
            id="paymentMethod"
            name="paymentMethod"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            value={values.paymentMethod}
            onChange={updateValue("paymentMethod")}
            required
          >
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="transfer">Transfer</option>
            <option value="other">Other</option>
          </select>
          {fieldErrors.paymentMethod ? (
            <p className="mt-1 text-xs text-rose-600">{fieldErrors.paymentMethod}</p>
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
          <label className="text-sm font-medium text-slate-700" htmlFor="amount">
            Amount
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            min={0}
            step="0.01"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            value={values.amount}
            onChange={updateValue("amount")}
            required
          />
          {fieldErrors.amount ? (
            <p className="mt-1 text-xs text-rose-600">{fieldErrors.amount}</p>
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

      {expenseId ? <input type="hidden" name="expenseId" value={expenseId} /> : null}

      {state.error ? <p className="text-sm text-rose-600">{state.error}</p> : null}

      <div className="flex items-center gap-3">
        <SubmitButton label={submitLabel} />
        <a className="text-sm font-semibold text-slate-600 hover:text-slate-900" href="/expenses">
          Cancel
        </a>
      </div>
    </form>
  );
}
