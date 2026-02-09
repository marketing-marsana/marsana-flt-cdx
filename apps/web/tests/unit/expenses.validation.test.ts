import { describe, expect, it } from "vitest";

import { normalizeExpenseInput, validateExpenseInput } from "@/lib/expenses/validation";

const baseValues = {
  branchId: "branch-1",
  relatedVehicleId: "",
  relatedTripId: "",
  expenseDate: "2026-02-08T10:00",
  category: "toll" as const,
  description: "Toll road",
  amount: "25",
  paymentMethod: "cash" as const,
  notes: "",
};

describe("validateExpenseInput", () => {
  it("requires required fields", () => {
    const errors = validateExpenseInput({
      branchId: "",
      relatedVehicleId: "",
      relatedTripId: "",
      expenseDate: "",
      category: "" as never,
      description: "",
      amount: "",
      paymentMethod: "" as never,
      notes: "",
    });

    expect(errors.branchId).toBeDefined();
    expect(errors.expenseDate).toBeDefined();
    expect(errors.category).toBeDefined();
    expect(errors.description).toBeDefined();
    expect(errors.amount).toBeDefined();
    expect(errors.paymentMethod).toBeDefined();
  });

  it("normalizes inputs", () => {
    const normalized = normalizeExpenseInput(baseValues);
    expect(normalized.description).toBe("Toll road");
  });

  it("rejects non-positive amount", () => {
    const errors = validateExpenseInput({ ...baseValues, amount: "0" });
    expect(errors.amount).toBeDefined();
  });
});
