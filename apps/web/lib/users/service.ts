import { normalizeUserInput, validateUserInput } from "@/lib/users/validation";
import { PermissionRow, UserFormValues, UserProfileRecord } from "@/lib/users/types";

export type UserActionResult = {
  success?: boolean;
  error?: string;
  fieldErrors?: Partial<Record<keyof UserFormValues, string>>;
  userId?: string;
};

export type UserRepo = {
  getProfile: (userId: string) => Promise<{ is_super_admin: boolean } | null>;
  getUserProfile: (userId: string) => Promise<UserProfileRecord | null>;
  findProfileByEmail: (
    email: string,
    excludeUserId?: string,
  ) => Promise<{ user_id: string } | null>;
  createAuthUser: (email: string, password: string) => Promise<{ id: string }>;
  updateAuthUser: (userId: string, params: { email?: string; password?: string }) => Promise<void>;
  setAuthBan: (userId: string, isActive: boolean) => Promise<void>;
  insertUserProfile: (values: UserFormValues, userId: string) => Promise<UserProfileRecord>;
  updateUserProfile: (values: UserFormValues, userId: string) => Promise<UserProfileRecord>;
  softDeleteUser: (userId: string) => Promise<void>;
  fetchPermissions: (userId: string) => Promise<PermissionRow[]>;
  replacePermissions: (userId: string, permissions: PermissionRow[]) => Promise<void>;
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

async function requireSuperAdmin(repo: UserRepo, userId: string): Promise<UserActionResult | null> {
  const profile = await repo.getProfile(userId);
  if (!profile?.is_super_admin) {
    return { error: "Access denied. Super Admin permissions required." };
  }
  return null;
}

function serializePermissions(permissions: PermissionRow[]) {
  return permissions.map((permission) => ({
    module: permission.module,
    can_view: permission.can_view,
    can_create: permission.can_create,
    can_edit: permission.can_edit,
    can_delete: permission.can_delete,
  }));
}

export async function createUser(
  repo: UserRepo,
  actorId: string,
  input: UserFormValues,
): Promise<UserActionResult> {
  const permissionError = await requireSuperAdmin(repo, actorId);
  if (permissionError) {
    return permissionError;
  }

  const normalized = normalizeUserInput(input);
  const fieldErrors = validateUserInput(normalized, "create");
  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const existingEmail = await repo.findProfileByEmail(normalized.email);
  if (existingEmail) {
    return { fieldErrors: { email: "Email already exists." } };
  }

  const authUser = await repo.createAuthUser(normalized.email, normalized.password);
  const profile = await repo.insertUserProfile(normalized, authUser.id);

  await repo.replacePermissions(profile.user_id, normalized.permissions);

  await repo.insertAuditLog({
    userId: actorId,
    branchId: profile.branch_id,
    action: "user.create",
    entityType: "user",
    entityId: profile.user_id,
    newData: {
      profile,
      permissions: serializePermissions(normalized.permissions),
    },
  });

  return { success: true, userId: profile.user_id };
}

export async function updateUser(
  repo: UserRepo,
  actorId: string,
  userId: string,
  input: UserFormValues,
): Promise<UserActionResult> {
  const permissionError = await requireSuperAdmin(repo, actorId);
  if (permissionError) {
    return permissionError;
  }

  const existingProfile = await repo.getUserProfile(userId);
  if (!existingProfile) {
    return { error: "User not found." };
  }

  const normalized = normalizeUserInput(input);
  const fieldErrors = validateUserInput(normalized, "edit");
  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const existingEmail = await repo.findProfileByEmail(normalized.email, userId);
  if (existingEmail) {
    return { fieldErrors: { email: "Email already exists." } };
  }

  await repo.updateAuthUser(userId, {
    email: normalized.email,
    password: normalized.resetPassword ? normalized.password : undefined,
  });

  await repo.setAuthBan(userId, normalized.status === "ACTIVE");

  const updatedProfile = await repo.updateUserProfile(normalized, userId);

  const previousPermissions = await repo.fetchPermissions(userId);
  await repo.replacePermissions(userId, normalized.permissions);

  await repo.insertAuditLog({
    userId: actorId,
    branchId: updatedProfile.branch_id,
    action: "user.update",
    entityType: "user",
    entityId: updatedProfile.user_id,
    oldData: { profile: existingProfile },
    newData: { profile: updatedProfile },
  });

  if (existingProfile.is_active !== updatedProfile.is_active) {
    await repo.insertAuditLog({
      userId: actorId,
      branchId: updatedProfile.branch_id,
      action: "user.status_change",
      entityType: "user",
      entityId: updatedProfile.user_id,
      oldData: { status: existingProfile.is_active ? "ACTIVE" : "INACTIVE" },
      newData: { status: updatedProfile.is_active ? "ACTIVE" : "INACTIVE" },
    });
  }

  await repo.insertAuditLog({
    userId: actorId,
    branchId: updatedProfile.branch_id,
    action: "user.permissions_change",
    entityType: "user",
    entityId: updatedProfile.user_id,
    oldData: { permissions: serializePermissions(previousPermissions) },
    newData: { permissions: serializePermissions(normalized.permissions) },
  });

  return { success: true, userId: updatedProfile.user_id };
}

export async function deleteUser(
  repo: UserRepo,
  actorId: string,
  userId: string,
): Promise<UserActionResult> {
  const permissionError = await requireSuperAdmin(repo, actorId);
  if (permissionError) {
    return permissionError;
  }

  const profile = await repo.getUserProfile(userId);
  if (!profile) {
    return { error: "User not found." };
  }

  await repo.softDeleteUser(userId);
  await repo.setAuthBan(userId, false);

  await repo.insertAuditLog({
    userId: actorId,
    branchId: profile.branch_id,
    action: "user.delete",
    entityType: "user",
    entityId: profile.user_id,
    oldData: profile,
  });

  return { success: true };
}
