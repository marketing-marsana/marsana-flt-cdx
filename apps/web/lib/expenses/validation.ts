import { ExpenseFieldErrors, ExpenseFormValues } from "@/lib/expenses/types";

export function normalizeExpenseInput(values: ExpenseFormValues): ExpenseFormValues {
  return {
    branchId: values.branchId.trim(),
    relatedVehicleId: values.relatedVehicleId.trim(),
    relatedTripId: values.relatedTripId.trim(),
    expenseDate: values.expenseDate,
    category: values.category,
    description: values.description.trim(),
    amount: values.amount.trim(),
    paymentMethod: values.paymentMethod,
    notes: values.notes.trim(),
  };
}

export function validateExpenseInput(values: ExpenseFormValues): ExpenseFieldErrors {
  const errors: ExpenseFieldErrors = {};

  if (!values.branchId) {
    errors.branchId = "Branch assignment is required.";
  }

  if (!values.expenseDate) {
    errors.expenseDate = "Expense date is required.";
  }

  if (!values.category) {
    errors.category = "Category is required.";
  }

  if (!values.description) {
    errors.description = "Description is required.";
  }

  if (!values.paymentMethod) {
    errors.paymentMethod = "Payment method is required.";
  }

  if (!values.amount) {
    errors.amount = "Amount is required.";
  }

  const amount = Number(values.amount);
  if (values.amount && (!Number.isFinite(amount) || amount <= 0)) {
    errors.amount = "Amount must be greater than zero.";
  }

  if (!values.description && !values.relatedTripId && !values.relatedVehicleId) {
    errors.description = "Provide a description or link a vehicle/trip.";
  }

  return errors;
}
