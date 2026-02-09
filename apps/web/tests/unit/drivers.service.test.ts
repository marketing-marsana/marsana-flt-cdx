import { describe, expect, it, vi } from "vitest";

import { createDriver, deleteDriver, updateDriver } from "@/lib/drivers/service";
import { DriverFormValues, DriverRecord } from "@/lib/drivers/types";

const baseValues: DriverFormValues = {
  branchId: "branch-1",
  fullName: "Driver One",
  phone: "0500000000",
  licenseNumber: "ABC-123",
  licenseExpiryDate: "",
  status: "ACTIVE",
  notes: "",
};

function createMockRepo(overrides = {}) {
  const driver: DriverRecord = {
    id: "driver-1",
    branch_id: "branch-1",
    full_name: "Driver One",
    phone: "0500000000",
    license_number: "ABC-123",
    license_expiry_date: null,
    status: "ACTIVE",
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
    findDriverById: vi.fn().mockResolvedValue(driver),
    findDriverByLicense: vi.fn().mockResolvedValue(null),
    insertDriver: vi.fn().mockResolvedValue(driver),
    updateDriver: vi.fn().mockResolvedValue({ ...driver, status: "INACTIVE" }),
    softDeleteDriver: vi.fn().mockResolvedValue(undefined),
    insertAuditLog: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("driver service", () => {
  it("creates driver with audit log", async () => {
    const repo = createMockRepo();
    const result = await createDriver(repo, "admin-1", baseValues);

    expect(result.success).toBe(true);
    expect(repo.insertDriver).toHaveBeenCalled();
    expect(repo.insertAuditLog).toHaveBeenCalled();
  });

  it("blocks update without permission", async () => {
    const repo = createMockRepo({
      getProfile: vi.fn().mockResolvedValue({ is_super_admin: false, branch_id: "branch-1" }),
      getPermission: vi.fn().mockResolvedValue({
        can_view: true,
        can_create: false,
        can_edit: false,
        can_delete: false,
      }),
    });
    const result = await updateDriver(repo, "user-1", "driver-1", baseValues);

    expect(result.error).toContain("Permission");
  });

  it("soft deletes driver", async () => {
    const repo = createMockRepo();
    const result = await deleteDriver(repo, "admin-1", "driver-1");

    expect(result.success).toBe(true);
    expect(repo.softDeleteDriver).toHaveBeenCalled();
  });
});
