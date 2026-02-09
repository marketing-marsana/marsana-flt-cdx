import { calculateTotalAmount, normalizeFuelInput, validateFuelInput } from "@/lib/fuel/validation";
import { FuelFormValues, FuelRecord } from "@/lib/fuel/types";

export type FuelActionResult = {
  success?: boolean;
  error?: string;
  fieldErrors?: Partial<Record<keyof FuelFormValues, string>>;
  fuelId?: string;
};

export type FuelRepo = {
  getProfile: (
    userId: string,
  ) => Promise<{ is_super_admin: boolean; branch_id: string | null } | null>;
  getPermission: (userId: string) => Promise<{
    can_view: boolean;
    can_create: boolean;
    can_edit: boolean;
    can_delete: boolean;
  } | null>;
  findFuelLogById: (fuelId: string) => Promise<FuelRecord | null>;
  getVehicle: (vehicleId: string) => Promise<{ id: string; branch_id: string } | null>;
  getTrip: (
    tripId: string,
  ) => Promise<{ id: string; branch_id: string; vehicle_id: string } | null>;
  getLatestOdometer: (
    vehicleId: string,
    excludeId?: string,
  ) => Promise<{ odometer: number } | null>;
  insertFuelLog: (values: FuelFormValues) => Promise<FuelRecord>;
  updateFuelLog: (fuelId: string, values: FuelFormValues) => Promise<FuelRecord>;
  softDeleteFuelLog: (fuelId: string) => Promise<void>;
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
  repo: FuelRepo,
  userId: string,
  action: "view" | "create" | "edit" | "delete",
): Promise<FuelActionResult | null> {
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
  repo: FuelRepo,
  values: FuelFormValues,
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

async function validateOdometer(repo: FuelRepo, values: FuelFormValues, excludeId?: string) {
  const latest = await repo.getLatestOdometer(values.vehicleId, excludeId);
  if (!latest) {
    return null;
  }
  const odometer = Number(values.odometer);
  if (Number.isFinite(odometer) && odometer < latest.odometer) {
    return `Odometer cannot decrease below ${latest.odometer}.`;
  }

  return null;
}

function validateTotals(values: FuelFormValues) {
  const expected = calculateTotalAmount(values.quantityLiters, values.pricePerLiter);
  const provided = Number(values.totalAmount);
  if (!Number.isFinite(provided) || Math.abs(expected - provided) > 0.01) {
    return "Total amount must match quantity × price.";
  }
  return null;
}

export async function createFuelLog(
  repo: FuelRepo,
  userId: string,
  input: FuelFormValues,
): Promise<FuelActionResult> {
  const permissionError = await requirePermission(repo, userId, "create");
  if (permissionError) {
    return permissionError;
  }

  const normalized = normalizeFuelInput(input);
  const fieldErrors = validateFuelInput(normalized);

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

  const totalError = validateTotals(normalized);
  if (totalError) {
    return { error: totalError };
  }

  const fuelLog = await repo.insertFuelLog(normalized);

  await repo.insertAuditLog({
    userId,
    branchId: fuelLog.branch_id,
    action: "fuel.create",
    entityType: "fuel_log",
    entityId: fuelLog.id,
    newData: fuelLog,
  });

  return { success: true, fuelId: fuelLog.id };
}

export async function updateFuelLog(
  repo: FuelRepo,
  userId: string,
  fuelId: string,
  input: FuelFormValues,
): Promise<FuelActionResult> {
  const permissionError = await requirePermission(repo, userId, "edit");
  if (permissionError) {
    return permissionError;
  }

  const existing = await repo.findFuelLogById(fuelId);
  if (!existing) {
    return { error: "Fuel log not found." };
  }

  const normalized = normalizeFuelInput(input);
  const fieldErrors = validateFuelInput(normalized);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const branchCheck = await validateBranchAssignments(repo, normalized);
  if (branchCheck) {
    return { error: branchCheck };
  }

  const odometerError = await validateOdometer(repo, normalized, fuelId);
  if (odometerError) {
    return { error: odometerError };
  }

  const totalError = validateTotals(normalized);
  if (totalError) {
    return { error: totalError };
  }

  const updated = await repo.updateFuelLog(fuelId, normalized);

  await repo.insertAuditLog({
    userId,
    branchId: updated.branch_id,
    action: "fuel.update",
    entityType: "fuel_log",
    entityId: updated.id,
    oldData: existing,
    newData: updated,
  });

  return { success: true, fuelId: updated.id };
}

export async function deleteFuelLog(
  repo: FuelRepo,
  userId: string,
  fuelId: string,
): Promise<FuelActionResult> {
  const permissionError = await requirePermission(repo, userId, "delete");
  if (permissionError) {
    return permissionError;
  }

  const existing = await repo.findFuelLogById(fuelId);
  if (!existing) {
    return { error: "Fuel log not found." };
  }

  await repo.softDeleteFuelLog(fuelId);

  await repo.insertAuditLog({
    userId,
    branchId: existing.branch_id,
    action: "fuel.delete",
    entityType: "fuel_log",
    entityId: existing.id,
    oldData: existing,
  });

  return { success: true };
}
