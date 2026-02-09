import { normalizeVehicleInput, validateVehicleInput } from "@/lib/vehicles/validation";
import { VehicleFormValues, VehicleRecord } from "@/lib/vehicles/types";

export type VehicleActionResult = {
  success?: boolean;
  error?: string;
  fieldErrors?: Partial<Record<keyof VehicleFormValues, string>>;
  vehicleId?: string;
};

export type VehicleRepo = {
  getProfile: (
    userId: string,
  ) => Promise<{ is_super_admin: boolean; branch_id: string | null } | null>;
  getPermission: (userId: string) => Promise<{
    can_view: boolean;
    can_create: boolean;
    can_edit: boolean;
    can_delete: boolean;
  } | null>;
  findVehicleById: (vehicleId: string) => Promise<VehicleRecord | null>;
  findVehicleByRegistration: (
    branchId: string,
    registrationNumber: string,
    excludeId?: string,
  ) => Promise<{ id: string } | null>;
  findVehicleByVin: (vin: string, excludeId?: string) => Promise<{ id: string } | null>;
  insertVehicle: (values: VehicleFormValues) => Promise<VehicleRecord>;
  updateVehicle: (vehicleId: string, values: VehicleFormValues) => Promise<VehicleRecord>;
  softDeleteVehicle: (vehicleId: string) => Promise<void>;
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
  repo: VehicleRepo,
  userId: string,
  action: "view" | "create" | "edit" | "delete",
): Promise<VehicleActionResult | null> {
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

export async function createVehicle(
  repo: VehicleRepo,
  userId: string,
  input: VehicleFormValues,
): Promise<VehicleActionResult> {
  const permissionError = await requirePermission(repo, userId, "create");
  if (permissionError) {
    return permissionError;
  }

  const normalized = normalizeVehicleInput(input);
  const fieldErrors = validateVehicleInput(normalized);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const existingReg = await repo.findVehicleByRegistration(
    normalized.branchId,
    normalized.registrationNumber,
  );
  if (existingReg) {
    return {
      fieldErrors: { registrationNumber: "Registration number already exists for this branch." },
    };
  }

  if (normalized.vin) {
    const existingVin = await repo.findVehicleByVin(normalized.vin);
    if (existingVin) {
      return { fieldErrors: { vin: "VIN already exists." } };
    }
  }

  const vehicle = await repo.insertVehicle(normalized);

  await repo.insertAuditLog({
    userId,
    branchId: vehicle.branch_id,
    action: "vehicle.create",
    entityType: "vehicle",
    entityId: vehicle.id,
    newData: vehicle,
  });

  return { success: true, vehicleId: vehicle.id };
}

export async function updateVehicle(
  repo: VehicleRepo,
  userId: string,
  vehicleId: string,
  input: VehicleFormValues,
): Promise<VehicleActionResult> {
  const permissionError = await requirePermission(repo, userId, "edit");
  if (permissionError) {
    return permissionError;
  }

  const existing = await repo.findVehicleById(vehicleId);
  if (!existing) {
    return { error: "Vehicle not found." };
  }

  const normalized = normalizeVehicleInput(input);
  const fieldErrors = validateVehicleInput(normalized);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const odometerValue = Number(normalized.odometer);
  if (odometerValue < existing.odometer) {
    return { fieldErrors: { odometer: "Odometer cannot decrease." } };
  }

  const existingReg = await repo.findVehicleByRegistration(
    normalized.branchId,
    normalized.registrationNumber,
    vehicleId,
  );
  if (existingReg) {
    return {
      fieldErrors: { registrationNumber: "Registration number already exists for this branch." },
    };
  }

  if (normalized.vin) {
    const existingVin = await repo.findVehicleByVin(normalized.vin, vehicleId);
    if (existingVin) {
      return { fieldErrors: { vin: "VIN already exists." } };
    }
  }

  const updated = await repo.updateVehicle(vehicleId, normalized);

  await repo.insertAuditLog({
    userId,
    branchId: updated.branch_id,
    action: "vehicle.update",
    entityType: "vehicle",
    entityId: updated.id,
    oldData: existing,
    newData: updated,
  });

  if (existing.status !== updated.status) {
    await repo.insertAuditLog({
      userId,
      branchId: updated.branch_id,
      action: "vehicle.status_change",
      entityType: "vehicle",
      entityId: updated.id,
      oldData: { status: existing.status },
      newData: { status: updated.status },
    });
  }

  return { success: true, vehicleId: updated.id };
}

export async function deleteVehicle(
  repo: VehicleRepo,
  userId: string,
  vehicleId: string,
): Promise<VehicleActionResult> {
  const permissionError = await requirePermission(repo, userId, "delete");
  if (permissionError) {
    return permissionError;
  }

  const existing = await repo.findVehicleById(vehicleId);
  if (!existing) {
    return { error: "Vehicle not found." };
  }

  await repo.softDeleteVehicle(vehicleId);

  await repo.insertAuditLog({
    userId,
    branchId: existing.branch_id,
    action: "vehicle.delete",
    entityType: "vehicle",
    entityId: existing.id,
    oldData: existing,
  });

  return { success: true };
}
