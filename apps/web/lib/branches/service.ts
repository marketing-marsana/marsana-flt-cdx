import { BranchFieldErrors, BranchFormValues, BranchRecord } from "@/lib/branches/types";
import { normalizeBranchInput, validateBranchInput } from "@/lib/branches/validation";

export type BranchActionResult = {
  success?: boolean;
  error?: string;
  fieldErrors?: BranchFieldErrors;
  branchId?: string;
};

export type BranchRepo = {
  getProfile: (userId: string) => Promise<{ is_super_admin: boolean } | null>;
  findBranchById: (branchId: string) => Promise<BranchRecord | null>;
  findBranchByName: (name: string, excludeId?: string) => Promise<BranchRecord | null>;
  findBranchByCode: (code: string, excludeId?: string) => Promise<BranchRecord | null>;
  insertBranch: (values: BranchFormValues) => Promise<BranchRecord>;
  updateBranch: (branchId: string, values: BranchFormValues) => Promise<BranchRecord>;
  softDeleteBranch: (branchId: string) => Promise<void>;
  countActiveUsers: (branchId: string) => Promise<number>;
  countRelatedRecords: (branchId: string) => Promise<number>;
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

async function requireSuperAdmin(
  repo: BranchRepo,
  userId: string,
): Promise<BranchActionResult | null> {
  const profile = await repo.getProfile(userId);
  if (!profile?.is_super_admin) {
    return { error: "Access denied. Super Admin permissions required." };
  }
  return null;
}

export async function createBranch(
  repo: BranchRepo,
  userId: string,
  input: BranchFormValues,
): Promise<BranchActionResult> {
  const permissionError = await requireSuperAdmin(repo, userId);
  if (permissionError) {
    return permissionError;
  }

  const normalized = normalizeBranchInput(input);
  const fieldErrors = validateBranchInput(normalized);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const existingName = await repo.findBranchByName(normalized.name);
  if (existingName) {
    return { fieldErrors: { name: "Branch name already exists." } };
  }

  const existingCode = await repo.findBranchByCode(normalized.code);
  if (existingCode) {
    return { fieldErrors: { code: "Branch code already exists." } };
  }

  const branch = await repo.insertBranch(normalized);

  await repo.insertAuditLog({
    userId,
    branchId: branch.id,
    action: "branch.create",
    entityType: "branch",
    entityId: branch.id,
    newData: branch,
  });

  return { success: true, branchId: branch.id };
}

export async function updateBranch(
  repo: BranchRepo,
  userId: string,
  branchId: string,
  input: BranchFormValues,
): Promise<BranchActionResult> {
  const permissionError = await requireSuperAdmin(repo, userId);
  if (permissionError) {
    return permissionError;
  }

  const branch = await repo.findBranchById(branchId);
  if (!branch) {
    return { error: "Branch not found." };
  }

  const normalized = normalizeBranchInput(input);
  const fieldErrors = validateBranchInput(normalized);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const existingName = await repo.findBranchByName(normalized.name, branchId);
  if (existingName) {
    return { fieldErrors: { name: "Branch name already exists." } };
  }

  const existingCode = await repo.findBranchByCode(normalized.code, branchId);
  if (existingCode) {
    return { fieldErrors: { code: "Branch code already exists." } };
  }

  const updated = await repo.updateBranch(branchId, normalized);

  await repo.insertAuditLog({
    userId,
    branchId: branchId,
    action: "branch.update",
    entityType: "branch",
    entityId: branchId,
    oldData: branch,
    newData: updated,
  });

  if (branch.status !== updated.status) {
    await repo.insertAuditLog({
      userId,
      branchId: branchId,
      action: "branch.status_change",
      entityType: "branch",
      entityId: branchId,
      oldData: { status: branch.status },
      newData: { status: updated.status },
    });
  }

  return { success: true, branchId: updated.id };
}

export async function deleteBranch(
  repo: BranchRepo,
  userId: string,
  branchId: string,
): Promise<BranchActionResult> {
  const permissionError = await requireSuperAdmin(repo, userId);
  if (permissionError) {
    return permissionError;
  }

  const branch = await repo.findBranchById(branchId);
  if (!branch) {
    return { error: "Branch not found." };
  }

  const activeUsers = await repo.countActiveUsers(branchId);
  if (activeUsers > 0) {
    return { error: "Cannot delete branch with active users." };
  }

  const relatedRecords = await repo.countRelatedRecords(branchId);
  if (relatedRecords > 0) {
    return { error: "Cannot delete branch with related transactional records." };
  }

  await repo.softDeleteBranch(branchId);

  await repo.insertAuditLog({
    userId,
    branchId: branchId,
    action: "branch.delete",
    entityType: "branch",
    entityId: branchId,
    oldData: branch,
  });

  return { success: true };
}
