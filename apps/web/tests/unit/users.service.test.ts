import { describe, expect, it, vi } from "vitest";

import { DEFAULT_PERMISSIONS } from "@/lib/users/permissions";
import { createUser, deleteUser, updateUser } from "@/lib/users/service";
import { UserFormValues, UserProfileRecord } from "@/lib/users/types";

const baseValues: UserFormValues = {
  fullName: "Jane Doe",
  email: "jane@example.com",
  phone: "",
  branchId: "branch-1",
  designation: "Manager",
  status: "ACTIVE",
  password: "password123",
  resetPassword: false,
  isSuperAdmin: false,
  permissions: DEFAULT_PERMISSIONS.map((perm, index) => ({
    ...perm,
    can_view: index === 0,
  })),
};

function createMockRepo(overrides = {}) {
  const profile: UserProfileRecord = {
    id: "profile-1",
    user_id: "user-1",
    branch_id: "branch-1",
    full_name: "Jane Doe",
    email: "jane@example.com",
    phone: null,
    designation: "Manager",
    is_super_admin: false,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  };

  return {
    getProfile: vi.fn().mockResolvedValue({ is_super_admin: true }),
    getUserProfile: vi.fn().mockResolvedValue(profile),
    findProfileByEmail: vi.fn().mockResolvedValue(null),
    createAuthUser: vi.fn().mockResolvedValue({ id: "user-1" }),
    updateAuthUser: vi.fn().mockResolvedValue(undefined),
    setAuthBan: vi.fn().mockResolvedValue(undefined),
    insertUserProfile: vi.fn().mockResolvedValue(profile),
    updateUserProfile: vi.fn().mockResolvedValue({ ...profile, is_active: false }),
    softDeleteUser: vi.fn().mockResolvedValue(undefined),
    fetchPermissions: vi.fn().mockResolvedValue(DEFAULT_PERMISSIONS),
    replacePermissions: vi.fn().mockResolvedValue(undefined),
    insertAuditLog: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("user service", () => {
  it("creates user and permissions", async () => {
    const repo = createMockRepo();
    const result = await createUser(repo, "admin-1", baseValues);

    expect(result.success).toBe(true);
    expect(repo.createAuthUser).toHaveBeenCalled();
    expect(repo.replacePermissions).toHaveBeenCalled();
    expect(repo.insertAuditLog).toHaveBeenCalled();
  });

  it("blocks update when not super admin", async () => {
    const repo = createMockRepo({
      getProfile: vi.fn().mockResolvedValue({ is_super_admin: false }),
    });
    const result = await updateUser(repo, "user-2", "user-1", baseValues);

    expect(result.error).toContain("Super Admin");
  });

  it("soft deletes user and bans auth", async () => {
    const repo = createMockRepo();
    const result = await deleteUser(repo, "admin-1", "user-1");

    expect(result.success).toBe(true);
    expect(repo.softDeleteUser).toHaveBeenCalled();
    expect(repo.setAuthBan).toHaveBeenCalledWith("user-1", false);
  });
});
