import { describe, expect, it } from "vitest";

import { normalizeBranchInput, validateBranchInput } from "@/lib/branches/validation";

const baseValues = {
  name: "Jeddah HQ",
  code: "jed-hq",
  type: "HQ" as const,
  address: "",
  contactNumber: "",
  status: "ACTIVE" as const,
};

describe("validateBranchInput", () => {
  it("requires name, code, type, and status", () => {
    const errors = validateBranchInput({
      name: "",
      code: "",
      type: "" as never,
      address: "",
      contactNumber: "",
      status: "" as never,
    });

    expect(errors.name).toBeDefined();
    expect(errors.code).toBeDefined();
    expect(errors.type).toBeDefined();
    expect(errors.status).toBeDefined();
  });

  it("normalizes code to uppercase", () => {
    const normalized = normalizeBranchInput(baseValues);
    expect(normalized.code).toBe("JED-HQ");
  });
});
