import { describe, expect, it } from "vitest";

import { DEFAULT_PERMISSIONS } from "@/lib/users/permissions";
import { normalizeUserInput, validateUserInput } from "@/lib/users/validation";

const baseValues = {
  fullName: "Jane Doe",
  email: "jane@example.com",
  phone: "",
  branchId: "branch-1",
  designation: "Manager",
  status: "ACTIVE" as const,
  password: "password123",
  resetPassword: false,
  isSuperAdmin: false,
  permissions: DEFAULT_PERMISSIONS.map((perm, index) => ({
    ...perm,
    can_view: index === 0,
  })),
};

describe("validateUserInput", () => {
  it("requires at least one view permission", () => {
    const errors = validateUserInput(
      {
        ...baseValues,
        permissions: DEFAULT_PERMISSIONS,
      },
      "create",
    );

    expect(errors.permissions).toBeDefined();
  });

  it("normalizes email to lowercase", () => {
    const normalized = normalizeUserInput({
      ...baseValues,
      email: "Jane@Example.com",
    });

    expect(normalized.email).toBe("jane@example.com");
  });
});
