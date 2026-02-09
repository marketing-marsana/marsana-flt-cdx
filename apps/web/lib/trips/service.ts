import { isValidTransition, normalizeTripInput, validateTripInput } from "@/lib/trips/validation";
import { TripFormValues, TripRecord } from "@/lib/trips/types";

export type TripActionResult = {
  success?: boolean;
  error?: string;
  fieldErrors?: Partial<Record<keyof TripFormValues, string>>;
  tripId?: string;
};

export type TripRepo = {
  getProfile: (
    userId: string,
  ) => Promise<{ is_super_admin: boolean; branch_id: string | null } | null>;
  getPermission: (userId: string) => Promise<{
    can_view: boolean;
    can_create: boolean;
    can_edit: boolean;
    can_delete: boolean;
  } | null>;
  findTripById: (tripId: string) => Promise<TripRecord | null>;
  findTripByCode: (
    branchId: string,
    tripCode: string,
    excludeId?: string,
  ) => Promise<{ id: string } | null>;
  getDriver: (driverId: string) => Promise<{ id: string; branch_id: string } | null>;
  getVehicle: (vehicleId: string) => Promise<{ id: string; branch_id: string } | null>;
  findOverlappingTrips: (payload: {
    branchId: string;
    driverId: string;
    vehicleId: string;
    startAt: string;
    endAt: string | null;
    excludeId?: string;
  }) => Promise<
    {
      id: string;
      driver_id: string;
      vehicle_id: string;
      scheduled_start_at: string;
      scheduled_end_at: string | null;
      status: string;
    }[]
  >;
  insertTrip: (values: TripFormValues) => Promise<TripRecord>;
  updateTrip: (tripId: string, values: TripFormValues) => Promise<TripRecord>;
  softDeleteTrip: (tripId: string) => Promise<void>;
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
  repo: TripRepo,
  userId: string,
  action: "view" | "create" | "edit" | "delete",
): Promise<TripActionResult | null> {
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
  repo: TripRepo,
  values: TripFormValues,
): Promise<string | null> {
  const driver = await repo.getDriver(values.driverId);
  if (!driver) {
    return "Driver not found.";
  }
  if (driver.branch_id !== values.branchId) {
    return "Driver must belong to the selected branch.";
  }

  const vehicle = await repo.getVehicle(values.vehicleId);
  if (!vehicle) {
    return "Vehicle not found.";
  }
  if (vehicle.branch_id !== values.branchId) {
    return "Vehicle must belong to the selected branch.";
  }

  return null;
}

async function validateOverlaps(
  repo: TripRepo,
  values: TripFormValues,
  excludeId?: string,
): Promise<string | null> {
  const overlaps = await repo.findOverlappingTrips({
    branchId: values.branchId,
    driverId: values.driverId,
    vehicleId: values.vehicleId,
    startAt: values.scheduledStartAt,
    endAt: values.scheduledEndAt || null,
    excludeId,
  });

  if (overlaps.length > 0) {
    return "Driver or vehicle has an overlapping trip.";
  }

  return null;
}

export async function createTrip(
  repo: TripRepo,
  userId: string,
  input: TripFormValues,
): Promise<TripActionResult> {
  const permissionError = await requirePermission(repo, userId, "create");
  if (permissionError) {
    return permissionError;
  }

  const normalized = normalizeTripInput(input);
  const fieldErrors = validateTripInput(normalized);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const branchCheck = await validateBranchAssignments(repo, normalized);
  if (branchCheck) {
    return { error: branchCheck };
  }

  const existingCode = await repo.findTripByCode(normalized.branchId, normalized.tripCode);
  if (existingCode) {
    return { fieldErrors: { tripCode: "Trip code already exists for this branch." } };
  }

  const overlapError = await validateOverlaps(repo, normalized);
  if (overlapError) {
    return { error: overlapError };
  }

  const trip = await repo.insertTrip(normalized);

  await repo.insertAuditLog({
    userId,
    branchId: trip.branch_id,
    action: "trip.create",
    entityType: "trip",
    entityId: trip.id,
    newData: trip,
  });

  return { success: true, tripId: trip.id };
}

export async function updateTrip(
  repo: TripRepo,
  userId: string,
  tripId: string,
  input: TripFormValues,
): Promise<TripActionResult> {
  const permissionError = await requirePermission(repo, userId, "edit");
  if (permissionError) {
    return permissionError;
  }

  const existing = await repo.findTripById(tripId);
  if (!existing) {
    return { error: "Trip not found." };
  }

  const normalized = normalizeTripInput(input);
  const fieldErrors = validateTripInput(normalized);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  if (!isValidTransition(existing.status, normalized.status)) {
    return { error: "Invalid status transition." };
  }

  const branchCheck = await validateBranchAssignments(repo, normalized);
  if (branchCheck) {
    return { error: branchCheck };
  }

  const existingCode = await repo.findTripByCode(normalized.branchId, normalized.tripCode, tripId);
  if (existingCode) {
    return { fieldErrors: { tripCode: "Trip code already exists for this branch." } };
  }

  const overlapError = await validateOverlaps(repo, normalized, tripId);
  if (overlapError) {
    return { error: overlapError };
  }

  const updated = await repo.updateTrip(tripId, normalized);

  await repo.insertAuditLog({
    userId,
    branchId: updated.branch_id,
    action: "trip.update",
    entityType: "trip",
    entityId: updated.id,
    oldData: existing,
    newData: updated,
  });

  if (existing.status !== updated.status) {
    await repo.insertAuditLog({
      userId,
      branchId: updated.branch_id,
      action: "trip.status_change",
      entityType: "trip",
      entityId: updated.id,
      oldData: { status: existing.status },
      newData: { status: updated.status },
    });
  }

  return { success: true, tripId: updated.id };
}

export async function startTrip(repo: TripRepo, userId: string, tripId: string) {
  const permissionError = await requirePermission(repo, userId, "edit");
  if (permissionError) {
    return permissionError;
  }

  const existing = await repo.findTripById(tripId);
  if (!existing) {
    return { error: "Trip not found." };
  }

  if (!isValidTransition(existing.status, "IN_PROGRESS")) {
    return { error: "Invalid status transition." };
  }

  const updated = await repo.updateTrip(tripId, {
    branchId: existing.branch_id,
    driverId: existing.driver_id,
    vehicleId: existing.vehicle_id,
    tripCode: existing.trip_code,
    customerName: existing.customer_name ?? "",
    customerPhone: existing.customer_phone ?? "",
    pickupLocation: existing.pickup_location,
    dropoffLocation: existing.dropoff_location,
    scheduledStartAt: existing.scheduled_start_at,
    scheduledEndAt: existing.scheduled_end_at ?? "",
    actualStartAt: new Date().toISOString(),
    actualEndAt: existing.actual_end_at ?? "",
    distanceKm: existing.distance_km ? String(existing.distance_km) : "",
    fareAmount: existing.fare_amount ? String(existing.fare_amount) : "",
    status: "IN_PROGRESS",
    notes: existing.notes ?? "",
  });

  await repo.insertAuditLog({
    userId,
    branchId: updated.branch_id,
    action: "trip.start",
    entityType: "trip",
    entityId: updated.id,
    oldData: { status: existing.status },
    newData: { status: updated.status, actual_start_at: updated.actual_start_at },
  });

  return { success: true, tripId: updated.id };
}

export async function completeTrip(repo: TripRepo, userId: string, tripId: string) {
  const permissionError = await requirePermission(repo, userId, "edit");
  if (permissionError) {
    return permissionError;
  }

  const existing = await repo.findTripById(tripId);
  if (!existing) {
    return { error: "Trip not found." };
  }

  if (!isValidTransition(existing.status, "COMPLETED")) {
    return { error: "Invalid status transition." };
  }

  const updated = await repo.updateTrip(tripId, {
    branchId: existing.branch_id,
    driverId: existing.driver_id,
    vehicleId: existing.vehicle_id,
    tripCode: existing.trip_code,
    customerName: existing.customer_name ?? "",
    customerPhone: existing.customer_phone ?? "",
    pickupLocation: existing.pickup_location,
    dropoffLocation: existing.dropoff_location,
    scheduledStartAt: existing.scheduled_start_at,
    scheduledEndAt: existing.scheduled_end_at ?? "",
    actualStartAt: existing.actual_start_at ?? "",
    actualEndAt: new Date().toISOString(),
    distanceKm: existing.distance_km ? String(existing.distance_km) : "",
    fareAmount: existing.fare_amount ? String(existing.fare_amount) : "",
    status: "COMPLETED",
    notes: existing.notes ?? "",
  });

  await repo.insertAuditLog({
    userId,
    branchId: updated.branch_id,
    action: "trip.complete",
    entityType: "trip",
    entityId: updated.id,
    oldData: { status: existing.status },
    newData: { status: updated.status, actual_end_at: updated.actual_end_at },
  });

  return { success: true, tripId: updated.id };
}

export async function cancelTrip(repo: TripRepo, userId: string, tripId: string) {
  const permissionError = await requirePermission(repo, userId, "edit");
  if (permissionError) {
    return permissionError;
  }

  const existing = await repo.findTripById(tripId);
  if (!existing) {
    return { error: "Trip not found." };
  }

  if (!isValidTransition(existing.status, "CANCELLED")) {
    return { error: "Invalid status transition." };
  }

  const updated = await repo.updateTrip(tripId, {
    branchId: existing.branch_id,
    driverId: existing.driver_id,
    vehicleId: existing.vehicle_id,
    tripCode: existing.trip_code,
    customerName: existing.customer_name ?? "",
    customerPhone: existing.customer_phone ?? "",
    pickupLocation: existing.pickup_location,
    dropoffLocation: existing.dropoff_location,
    scheduledStartAt: existing.scheduled_start_at,
    scheduledEndAt: existing.scheduled_end_at ?? "",
    actualStartAt: existing.actual_start_at ?? "",
    actualEndAt: existing.actual_end_at ?? "",
    distanceKm: existing.distance_km ? String(existing.distance_km) : "",
    fareAmount: existing.fare_amount ? String(existing.fare_amount) : "",
    status: "CANCELLED",
    notes: existing.notes ?? "",
  });

  await repo.insertAuditLog({
    userId,
    branchId: updated.branch_id,
    action: "trip.cancel",
    entityType: "trip",
    entityId: updated.id,
    oldData: { status: existing.status },
    newData: { status: updated.status },
  });

  return { success: true, tripId: updated.id };
}

export async function deleteTrip(
  repo: TripRepo,
  userId: string,
  tripId: string,
): Promise<TripActionResult> {
  const permissionError = await requirePermission(repo, userId, "delete");
  if (permissionError) {
    return permissionError;
  }

  const existing = await repo.findTripById(tripId);
  if (!existing) {
    return { error: "Trip not found." };
  }

  await repo.softDeleteTrip(tripId);

  await repo.insertAuditLog({
    userId,
    branchId: existing.branch_id,
    action: "trip.delete",
    entityType: "trip",
    entityId: existing.id,
    oldData: existing,
  });

  return { success: true };
}
