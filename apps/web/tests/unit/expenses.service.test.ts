import { describe, expect, it, vi } from "vitest";

import { createExpense, updateExpense } from "@/lib/expenses/service";
import { ExpenseFormValues, ExpenseRecord } from "@/lib/expenses/types";

const baseValues: ExpenseFormValues = {
  branchId: "branch-1",
  relatedVehicleId: "vehicle-1",
  relatedTripId: "",
  expenseDate: "2026-02-08T10:00:00.000Z",
  category: "toll",
  description: "Toll road",
  amount: "25",
  paymentMethod: "cash",
  notes: "",
};

function createMockRepo(overrides = {}) {
  const expense: ExpenseRecord = {
    id: "expense-1",
    branch_id: "branch-1",
    related_vehicle_id: "vehicle-1",
    related_trip_id: null,
    expense_date: "2026-02-08T10:00:00.000Z",
    category: "toll",
    description: "Toll road",
    amount: 25,
    payment_method: "cash",
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  };

  return {
    getProfile: vi.fn().mockResolvedValue({ is_super_admin: true, branch_id: "branch-1" }),
    getPermission: vi.fn().mockResolvedValue({
      can_view: true,
      can_create: true,
      can_edit: true,
      can_delete: true,
    }),
    findExpenseById: vi.fn().mockResolvedValue(expense),
    getVehicle: vi.fn().mockResolvedValue({ id: "vehicle-1", branch_id: "branch-1" }),
    getTrip: vi.fn().mockResolvedValue(null),
    insertExpense: vi.fn().mockResolvedValue(expense),
    updateExpense: vi.fn().mockResolvedValue({ ...expense, amount: 30 }),
    softDeleteExpense: vi.fn().mockResolvedValue(undefined),
    insertAuditLog: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("expense service", () => {
  it("creates expense with audit log", async () => {
    const repo = createMockRepo();
    const result = await createExpense(repo, "admin-1", baseValues);

    expect(result.success).toBe(true);
    expect(repo.insertExpense).toHaveBeenCalled();
    expect(repo.insertAuditLog).toHaveBeenCalled();
  });

  it("blocks related trip mismatch", async () => {
    const repo = createMockRepo({
      getTrip: vi
        .fn()
        .mockResolvedValue({ id: "trip-1", branch_id: "branch-1", vehicle_id: "vehicle-x" }),
    });
    const result = await createExpense(repo, "admin-1", { ...baseValues, relatedTripId: "trip-1" });

    expect(result.error).toContain("Related trip must match the selected vehicle");
  });

  it("updates expense log", async () => {
    const repo = createMockRepo();
    const result = await updateExpense(repo, "admin-1", "expense-1", baseValues);

    expect(result.success).toBe(true);
  });
});
