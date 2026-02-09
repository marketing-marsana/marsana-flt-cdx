export type ExpenseCategory = "toll" | "parking" | "petty_cash" | "misc" | "other";

export type ExpensePaymentMethod = "cash" | "card" | "transfer" | "other";

export type ExpenseFormValues = {
  branchId: string;
  relatedVehicleId: string;
  relatedTripId: string;
  expenseDate: string;
  category: ExpenseCategory;
  description: string;
  amount: string;
  paymentMethod: ExpensePaymentMethod;
  notes: string;
};

export type ExpenseRecord = {
  id: string;
  branch_id: string;
  related_vehicle_id: string | null;
  related_trip_id: string | null;
  expense_date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  payment_method: ExpensePaymentMethod;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type ExpenseFieldErrors = Partial<Record<keyof ExpenseFormValues, string>>;
