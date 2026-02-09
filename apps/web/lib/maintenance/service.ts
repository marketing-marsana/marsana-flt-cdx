import { normalizeMaintenanceInput, validateMaintenanceInput } from "@/lib/maintenance/validation";
import { MaintenanceFormValues, MaintenanceRecord } from "@/lib/maintenance/types";

export type MaintenanceActionResult = {
  success?: boolean;
  error?: string;
  fieldErrors?: Partial<Record<keyof MaintenanceFormValues, string>>;
  maintenanceId?: string;
};

export type MaintenanceRepo = {
  getProfile: (
    userId: string,
  ) => Promise<{ is_super_admin: boolean; branch_id: string | null } | null>;
  getPermission: (userId: string) => Promise<{
    can_view: boolean;
    can_create: boolean;
    can_edit: boolean;
    can_delete: boolean;
  } | null>;
  findMaintenanceById: (maintenanceId: string) => Promise<MaintenanceRecord | null>;
  getVehicle: (vehicleId: string) => Promise<{ id: string; branch_id: string } | null>;
  getTrip: (
    tripId: string,
  ) => Promise<{ id: string; branch_id: string; vehicle_id: string } | null>;
  getLatestMaintenanceOdometer: (
    vehicleId: string,
    excludeId?: string,
  ) => Promise<{ odometer: number } | null>;
  getLatestFuelOdometer: (vehicleId: string) => Promise<{ odometer: number } | null>;
  insertMaintenance: (values: MaintenanceFormValues) => Promise<MaintenanceRecord>;
  updateMaintenance: (
    maintenanceId: string,
    values: MaintenanceFormValues,
  ) => Promise<MaintenanceRecord>;
  softDeleteMaintenance: (maintenanceId: string) => Promise<void>;
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
  repo: MaintenanceRepo,
  userId: string,
  action: "view" | "create" | "edit" | "delete",
): Promise<MaintenanceActionResult | null> {
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

async function validateBranchAssignments(
  repo: MaintenanceRepo,
  values: MaintenanceFormValues,
): Promise<string | null> {
  const vehicle = await repo.getVehicle(values.vehicleId);
  if (!vehicle) {
    return "Vehicle not found.";
  }

  if (vehicle.branch_id !== values.branchId) {
    return "Vehicle must belong to the selected branch.";
  }

  if (values.tripId) {
    const trip = await repo.getTrip(values.tripId);
    if (!trip) {
      return "Trip not found.";
    }
    if (trip.branch_id !== values.branchId) {
      return "Trip must belong to the selected branch.";
    }
    if (trip.vehicle_id !== values.vehicleId) {
      return "Trip must match the selected vehicle.";
    }
  }

  return null;
}

async function validateOdometer(
  repo: MaintenanceRepo,
  values: MaintenanceFormValues,
  excludeId?: string,
): Promise<string | null> {
  const maintenanceOdometer = await repo.getLatestMaintenanceOdometer(values.vehicleId, excludeId);
  const fuelOdometer = await repo.getLatestFuelOdometer(values.vehicleId);

  const baseline = Math.max(maintenanceOdometer?.odometer ?? 0, fuelOdometer?.odometer ?? 0);

  const odometer = Number(values.odometer);
  if (Number.isFinite(odometer) && odometer < baseline) {
    return `Odometer cannot decrease below ${baseline}.`;
  }

  return null;
}

export async function createMaintenance(
  repo: MaintenanceRepo,
  userId: string,
  input: MaintenanceFormValues,
): Promise<MaintenanceActionResult> {
  const permissionError = await requirePermission(repo, userId, "create");
  if (permissionError) {
    return permissionError;
  }

  const normalized = normalizeMaintenanceInput(input);
  const fieldErrors = validateMaintenanceInput(normalized);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const branchCheck = await validateBranchAssignments(repo, normalized);
  if (branchCheck) {
    return { error: branchCheck };
  }

  const odometerError = await validateOdometer(repo, normalized);
  if (odometerError) {
    return { error: odometerError };
  }

  const maintenance = await repo.insertMaintenance(normalized);

  await repo.insertAuditLog({
    userId,
    branchId: maintenance.branch_id,
    action: "maintenance.create",
    entityType: "maintenance_log",
    entityId: maintenance.id,
    newData: maintenance,
  });

  return { success: true, maintenanceId: maintenance.id };
}

export async function updateMaintenance(
  repo: MaintenanceRepo,
  userId: string,
  maintenanceId: string,
  input: MaintenanceFormValues,
): Promise<MaintenanceActionResult> {
  const permissionError = await requirePermission(repo, userId, "edit");
  if (permissionError) {
    return permissionError;
  }

  const existing = await repo.findMaintenanceById(maintenanceId);
  if (!existing) {
    return { error: "Maintenance log not found." };
  }

  const normalized = normalizeMaintenanceInput(input);
  const fieldErrors = validateMaintenanceInput(normalized);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const branchCheck = await validateBranchAssignments(repo, normalized);
  if (branchCheck) {
    return { error: branchCheck };
  }

  const odometerError = await validateOdometer(repo, normalized, maintenanceId);
  if (odometerError) {
    return { error: odometerError };
  }

  const updated = await repo.updateMaintenance(maintenanceId, normalized);

  await repo.insertAuditLog({
    userId,
    branchId: updated.branch_id,
    action: "maintenance.update",
    entityType: "maintenance_log",
    entityId: updated.id,
    oldData: existing,
    newData: updated,
  });

  return { success: true, maintenanceId: updated.id };
}

export async function deleteMaintenance(
  repo: MaintenanceRepo,
  userId: string,
  maintenanceId: string,
): Promise<MaintenanceActionResult> {
  const permissionError = await requirePermission(repo, userId, "delete");
  if (permissionError) {
    return permissionError;
  }

  const existing = await repo.findMaintenanceById(maintenanceId);
  if (!existing) {
    return { error: "Maintenance log not found." };
  }

  await repo.softDeleteMaintenance(maintenanceId);

  await repo.insertAuditLog({
    userId,
    branchId: existing.branch_id,
    action: "maintenance.delete",
    entityType: "maintenance_log",
    entityId: existing.id,
    oldData: existing,
  });

  return { success: true };
}
