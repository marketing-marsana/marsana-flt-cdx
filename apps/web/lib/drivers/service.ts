import { normalizeDriverInput, validateDriverInput } from "@/lib/drivers/validation";
import { DriverFormValues, DriverRecord } from "@/lib/drivers/types";

export type DriverActionResult = {
  success?: boolean;
  error?: string;
  fieldErrors?: Partial<Record<keyof DriverFormValues, string>>;
  driverId?: string;
};

export type DriverRepo = {
  getProfile: (
    userId: string,
  ) => Promise<{ is_super_admin: boolean; branch_id: string | null } | null>;
  getPermission: (userId: string) => Promise<{
    can_view: boolean;
    can_create: boolean;
    can_edit: boolean;
    can_delete: boolean;
  } | null>;
  findDriverById: (driverId: string) => Promise<DriverRecord | null>;
  findDriverByLicense: (
    branchId: string,
    licenseNumber: string,
    excludeId?: string,
  ) => Promise<{ id: string } | null>;
  insertDriver: (values: DriverFormValues) => Promise<DriverRecord>;
  updateDriver: (driverId: string, values: DriverFormValues) => Promise<DriverRecord>;
  softDeleteDriver: (driverId: string) => Promise<void>;
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

async function requirePermission(
  repo: DriverRepo,
  userId: string,
  action: "view" | "create" | "edit" | "delete",
): Promise<DriverActionResult | null> {
  const profile = await repo.getProfile(userId);
  if (!profile) {
    return { error: "Access denied." };
  }

  if (profile.is_super_admin) {
    return null;
  }

  const permissions = await repo.getPermission(userId);
  const allowed = permissions?.[`can_${action}` as const];

  if (!allowed) {
    return { error: "Access denied. Permission required." };
  }

  return null;
}

export async function createDriver(
  repo: DriverRepo,
  userId: string,
  input: DriverFormValues,
): Promise<DriverActionResult> {
  const permissionError = await requirePermission(repo, userId, "create");
  if (permissionError) {
    return permissionError;
  }

  const normalized = normalizeDriverInput(input);
  const fieldErrors = validateDriverInput(normalized);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const existingLicense = await repo.findDriverByLicense(
    normalized.branchId,
    normalized.licenseNumber,
  );
  if (existingLicense) {
    return { fieldErrors: { licenseNumber: "License number already exists for this branch." } };
  }

  const driver = await repo.insertDriver(normalized);

  await repo.insertAuditLog({
    userId,
    branchId: driver.branch_id,
    action: "driver.create",
    entityType: "driver",
    entityId: driver.id,
    newData: driver,
  });

  return { success: true, driverId: driver.id };
}

export async function updateDriver(
  repo: DriverRepo,
  userId: string,
  driverId: string,
  input: DriverFormValues,
): Promise<DriverActionResult> {
  const permissionError = await requirePermission(repo, userId, "edit");
  if (permissionError) {
    return permissionError;
  }

  const existing = await repo.findDriverById(driverId);
  if (!existing) {
    return { error: "Driver not found." };
  }

  const normalized = normalizeDriverInput(input);
  const fieldErrors = validateDriverInput(normalized);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const existingLicense = await repo.findDriverByLicense(
    normalized.branchId,
    normalized.licenseNumber,
    driverId,
  );
  if (existingLicense) {
    return { fieldErrors: { licenseNumber: "License number already exists for this branch." } };
  }

  const updated = await repo.updateDriver(driverId, normalized);

  await repo.insertAuditLog({
    userId,
    branchId: updated.branch_id,
    action: "driver.update",
    entityType: "driver",
    entityId: updated.id,
    oldData: existing,
    newData: updated,
  });

  if (existing.status !== updated.status) {
    await repo.insertAuditLog({
      userId,
      branchId: updated.branch_id,
      action: "driver.status_change",
      entityType: "driver",
      entityId: updated.id,
      oldData: { status: existing.status },
      newData: { status: updated.status },
    });
  }

  return { success: true, driverId: updated.id };
}

export async function deleteDriver(
  repo: DriverRepo,
  userId: string,
  driverId: string,
): Promise<DriverActionResult> {
  const permissionError = await requirePermission(repo, userId, "delete");
  if (permissionError) {
    return permissionError;
  }

  const existing = await repo.findDriverById(driverId);
  if (!existing) {
    return { error: "Driver not found." };
  }

  await repo.softDeleteDriver(driverId);

  await repo.insertAuditLog({
    userId,
    branchId: existing.branch_id,
    action: "driver.delete",
    entityType: "driver",
    entityId: existing.id,
    oldData: existing,
  });

  return { success: true };
}
