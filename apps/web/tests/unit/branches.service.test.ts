import { describe, expect, it, vi } from "vitest";

import { BranchRepo, createBranch, deleteBranch, updateBranch } from "@/lib/branches/service";
import { BranchFormValues, BranchRecord } from "@/lib/branches/types";

const baseValues: BranchFormValues = {
  name: "Test Branch",
  code: "TST-001",
  type: "HQ",
  address: "",
  contactNumber: "",
  status: "ACTIVE",
};

function createMockRepo(overrides: Partial<BranchRepo> = {}): BranchRepo {
  const branch: BranchRecord = {
    id: "branch-1",
    name: "Test Branch",
    code: "TST-001",
    type: "HQ",
    address: null,
    contact_number: null,
    status: "ACTIVE",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  };

  return {
    getProfile: vi.fn().mockResolvedValue({ is_super_admin: true }),
    findBranchById: vi.fn().mockResolvedValue(branch),
    findBranchByName: vi.fn().mockResolvedValue(null),
    findBranchByCode: vi.fn().mockResolvedValue(null),
    insertBranch: vi.fn().mockResolvedValue(branch),
    updateBranch: vi.fn().mockResolvedValue({ ...branch, status: "INACTIVE" }),
    softDeleteBranch: vi.fn().mockResolvedValue(undefined),
    countActiveUsers: vi.fn().mockResolvedValue(0),
    countRelatedRecords: vi.fn().mockResolvedValue(0),
    insertAuditLog: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as BranchRepo;
}

describe("branch service", () => {
  it("creates a branch for super admin", async () => {
    const repo = createMockRepo();
    const result = await createBranch(repo, "user-1", baseValues);

    expect(result.success).toBe(true);
    expect(result.branchId).toBeDefined();
    expect(repo.insertBranch).toHaveBeenCalled();
    expect(repo.insertAuditLog).toHaveBeenCalled();
  });

  it("blocks delete when active users exist", async () => {
    const repo = createMockRepo({
      countActiveUsers: vi.fn().mockResolvedValue(2),
    });
    const result = await deleteBranch(repo, "user-1", "branch-1");

    expect(result.error).toContain("active users");
    expect(repo.softDeleteBranch).not.toHaveBeenCalled();
  });

  it("logs status change on update", async () => {
    const repo = createMockRepo();
    const result = await updateBranch(repo, "user-1", "branch-1", {
      ...baseValues,
      status: "INACTIVE",
    });

    expect(result.success).toBe(true);
    expect(repo.insertAuditLog).toHaveBeenCalled();
  });
});
