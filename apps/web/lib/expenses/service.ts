import { normalizeExpenseInput, validateExpenseInput } from "@/lib/expenses/validation";
import { ExpenseFormValues, ExpenseRecord } from "@/lib/expenses/types";

export type ExpenseActionResult = {
  success?: boolean;
  error?: string;
  fieldErrors?: Partial<Record<keyof ExpenseFormValues, string>>;
  expenseId?: string;
};

export type ExpenseRepo = {
  getProfile: (
    userId: string,
  ) => Promise<{ is_super_admin: boolean; branch_id: string | null } | null>;
  getPermission: (userId: string) => Promise<{
    can_view: boolean;
    can_create: boolean;
    can_edit: boolean;
    can_delete: boolean;
  } | null>;
  findExpenseById: (expenseId: string) => Promise<ExpenseRecord | null>;
  getVehicle: (vehicleId: string) => Promise<{ id: string; branch_id: string } | null>;
  getTrip: (
    tripId: string,
  ) => Promise<{ id: string; branch_id: string; vehicle_id: string } | null>;
  insertExpense: (values: ExpenseFormValues) => Promise<ExpenseRecord>;
  updateExpense: (expenseId: string, values: ExpenseFormValues) => Promise<ExpenseRecord>;
  softDeleteExpense: (expenseId: string) => Promise<void>;
  insertAuditLog: (payload: {
    userId: string;
    branchId: string | null;
    action: string;
    entityType: string;
    entityId: string | null;
    oldData?: Record<string, unknown> | null;
    newData?: Record<string, unknown> | null;
  }) => Promise<void>;
};

async function requirePermission(
  repo: ExpenseRepo,
  userId: string,
  action: "view" | "create" | "edit" | "delete",
): Promise<ExpenseActionResult | null> {
  const profile = await repo.getProfile(userId);
  if (!profile) {
    return { error: "Access denied." };
  }

  if (profile.is_super_admin) {
    return null;
  }

  const permissions = await repo.getPermission(userId);
  const allowed = permissions?.[`can_${action}` as const];

  if (!allowed) {
    return { error: "Access denied. Permission required." };
  }

  return null;
}

async function validateRelations(repo: ExpenseRepo, values: ExpenseFormValues) {
  if (values.relatedVehicleId) {
    const vehicle = await repo.getVehicle(values.relatedVehicleId);
    if (!vehicle) {
      return "Related vehicle not found.";
    }
    if (vehicle.branch_id !== values.branchId) {
      return "Related vehicle must belong to the selected branch.";
    }
  }

  if (values.relatedTripId) {
    const trip = await repo.getTrip(values.relatedTripId);
    if (!trip) {
      return "Related trip not found.";
    }
    if (trip.branch_id !== values.branchId) {
      return "Related trip must belong to the selected branch.";
    }
    if (values.relatedVehicleId && trip.vehicle_id !== values.relatedVehicleId) {
      return "Related trip must match the selected vehicle.";
    }
  }

  return null;
}

export async function createExpense(
  repo: ExpenseRepo,
  userId: string,
  input: ExpenseFormValues,
): Promise<ExpenseActionResult> {
  const permissionError = await requirePermission(repo, userId, "create");
  if (permissionError) {
    return permissionError;
  }

  const normalized = normalizeExpenseInput(input);
  const fieldErrors = validateExpenseInput(normalized);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const relationError = await validateRelations(repo, normalized);
  if (relationError) {
    return { error: relationError };
  }

  const expense = await repo.insertExpense(normalized);

  await repo.insertAuditLog({
    userId,
    branchId: expense.branch_id,
    action: "expense.create",
    entityType: "expense_log",
    entityId: expense.id,
    newData: expense,
  });

  return { success: true, expenseId: expense.id };
}

export async function updateExpense(
  repo: ExpenseRepo,
  userId: string,
  expenseId: string,
  input: ExpenseFormValues,
): Promise<ExpenseActionResult> {
  const permissionError = await requirePermission(repo, userId, "edit");
  if (permissionError) {
    return permissionError;
  }

  const existing = await repo.findExpenseById(expenseId);
  if (!existing) {
    return { error: "Expense log not found." };
  }

  const normalized = normalizeExpenseInput(input);
  const fieldErrors = validateExpenseInput(normalized);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const relationError = await validateRelations(repo, normalized);
  if (relationError) {
    return { error: relationError };
  }

  const updated = await repo.updateExpense(expenseId, normalized);

  await repo.insertAuditLog({
    userId,
    branchId: updated.branch_id,
    action: "expense.update",
    entityType: "expense_log",
    entityId: updated.id,
    oldData: existing,
    newData: updated,
  });

  return { success: true, expenseId: updated.id };
}

export async function deleteExpense(
  repo: ExpenseRepo,
  userId: string,
  expenseId: string,
): Promise<ExpenseActionResult> {
  const permissionError = await requirePermission(repo, userId, "delete");
  if (permissionError) {
    return permissionError;
  }

  const existing = await repo.findExpenseById(expenseId);
  if (!existing) {
    return { error: "Expense log not found." };
  }

  await repo.softDeleteExpense(expenseId);

  await repo.insertAuditLog({
    userId,
    branchId: existing.branch_id,
    action: "expense.delete",
    entityType: "expense_log",
    entityId: existing.id,
    oldData: existing,
  });

  return { success: true };
}
