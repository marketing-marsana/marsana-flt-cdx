"use server";

import { redirect } from "next/navigation";

import { createExpenseRepo } from "@/lib/expenses/repo";
import { ExpenseFormValues } from "@/lib/expenses/types";
import { createExpense, deleteExpense, updateExpense } from "@/lib/expenses/service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ExpenseActionState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof ExpenseFormValues, string>>;
};

function toExpenseFormValues(formData: FormData): ExpenseFormValues {
  return {
    branchId: String(formData.get("branchId") ?? ""),
    relatedVehicleId: String(formData.get("relatedVehicleId") ?? ""),
    relatedTripId: String(formData.get("relatedTripId") ?? ""),
    expenseDate: String(formData.get("expenseDate") ?? ""),
    category: (formData.get("category") as ExpenseFormValues["category"]) ?? "misc",
    description: String(formData.get("description") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    paymentMethod: (formData.get("paymentMethod") as ExpenseFormValues["paymentMethod"]) ?? "cash",
    notes: String(formData.get("notes") ?? ""),
  };
}

async function requireUser() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { supabase, user };
}

export async function createExpenseAction(
  _prev: ExpenseActionState,
  formData: FormData,
): Promise<ExpenseActionState> {
  const { supabase, user } = await requireUser();
  const repo = createExpenseRepo(supabase);
  const values = toExpenseFormValues(formData);

  const result = await createExpense(repo, user.id, values);

  if (result.fieldErrors) {
    return { fieldErrors: result.fieldErrors };
  }

  if (result.error) {
    return { error: result.error };
  }

  if (result.expenseId) {
    redirect(`/expenses/${result.expenseId}`);
  }

  return {};
}

export async function updateExpenseAction(
  _prev: ExpenseActionState,
  formData: FormData,
): Promise<ExpenseActionState> {
  const { supabase, user } = await requireUser();
  const repo = createExpenseRepo(supabase);
  const expenseId = String(formData.get("expenseId") ?? "");

  if (!expenseId) {
    return { error: "Expense ID is missing." };
  }

  const values = toExpenseFormValues(formData);
  const result = await updateExpense(repo, user.id, expenseId, values);

  if (result.fieldErrors) {
    return { fieldErrors: result.fieldErrors };
  }

  if (result.error) {
    return { error: result.error };
  }

  if (result.expenseId) {
    redirect(`/expenses/${result.expenseId}`);
  }

  return {};
}

export async function deleteExpenseAction(
  _prev: ExpenseActionState,
  formData: FormData,
): Promise<ExpenseActionState> {
  const { supabase, user } = await requireUser();
  const repo = createExpenseRepo(supabase);
  const expenseId = String(formData.get("expenseId") ?? "");
  const confirmLabel = String(formData.get("confirmLabel") ?? "").trim();

  if (!expenseId) {
    return { error: "Expense ID is missing." };
  }

  if (!confirmLabel) {
    return { error: "Please type the expense label to confirm deletion." };
  }

  const existing = await repo.findExpenseById(expenseId);
  if (!existing) {
    return { error: "Expense log not found." };
  }

  if (confirmLabel !== existing.id) {
    return { error: "Expense label confirmation does not match." };
  }

  const result = await deleteExpense(repo, user.id, expenseId);

  if (result.error) {
    return { error: result.error };
  }

  redirect("/expenses");
}
