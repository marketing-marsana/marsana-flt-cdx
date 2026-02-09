import { describe, expect, it } from "vitest";

import { normalizeDriverInput, validateDriverInput } from "@/lib/drivers/validation";

const baseValues = {
  branchId: "branch-1",
  fullName: "Driver One",
  phone: "0500000000",
  licenseNumber: "abc-123",
  licenseExpiryDate: "",
  status: "ACTIVE" as const,
  notes: "",
};

describe("validateDriverInput", () => {
  it("requires required fields", () => {
    const errors = validateDriverInput({
      branchId: "",
      fullName: "",
      phone: "",
      licenseNumber: "",
      licenseExpiryDate: "",
      status: "" as never,
      notes: "",
    });

    expect(errors.branchId).toBeDefined();
    expect(errors.fullName).toBeDefined();
    expect(errors.phone).toBeDefined();
    expect(errors.licenseNumber).toBeDefined();
    expect(errors.status).toBeDefined();
  });

  it("normalizes license number", () => {
    const normalized = normalizeDriverInput(baseValues);
    expect(normalized.licenseNumber).toBe("ABC-123");
  });
});
