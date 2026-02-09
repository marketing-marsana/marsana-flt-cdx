import { TripFieldErrors, TripFormValues } from "@/lib/trips/types";

export function normalizeTripInput(values: TripFormValues): TripFormValues {
  return {
    branchId: values.branchId.trim(),
    driverId: values.driverId.trim(),
    vehicleId: values.vehicleId.trim(),
    tripCode: values.tripCode.trim().toUpperCase(),
    customerName: values.customerName.trim(),
    customerPhone: values.customerPhone.trim(),
    pickupLocation: values.pickupLocation.trim(),
    dropoffLocation: values.dropoffLocation.trim(),
    scheduledStartAt: values.scheduledStartAt,
    scheduledEndAt: values.scheduledEndAt,
    actualStartAt: values.actualStartAt,
    actualEndAt: values.actualEndAt,
    distanceKm: values.distanceKm.trim(),
    fareAmount: values.fareAmount.trim(),
    status: values.status,
    notes: values.notes.trim(),
  };
}

export function validateTripInput(values: TripFormValues): TripFieldErrors {
  const errors: TripFieldErrors = {};

  if (!values.branchId) {
    errors.branchId = "Branch assignment is required.";
  }

  if (!values.driverId) {
    errors.driverId = "Driver selection is required.";
  }

  if (!values.vehicleId) {
    errors.vehicleId = "Vehicle selection is required.";
  }

  if (!values.tripCode) {
    errors.tripCode = "Trip code is required.";
  }

  if (!values.pickupLocation) {
    errors.pickupLocation = "Pickup location is required.";
  }

  if (!values.dropoffLocation) {
    errors.dropoffLocation = "Dropoff location is required.";
  }

  if (!values.scheduledStartAt) {
    errors.scheduledStartAt = "Scheduled start time is required.";
  }

  if (!values.status) {
    errors.status = "Status is required.";
  }

  if (values.distanceKm) {
    const distance = Number(values.distanceKm);
    if (!Number.isFinite(distance) || distance < 0) {
      errors.distanceKm = "Distance must be a non-negative number.";
    }
  }

  if (values.fareAmount) {
    const fare = Number(values.fareAmount);
    if (!Number.isFinite(fare) || fare < 0) {
      errors.fareAmount = "Fare amount must be a non-negative number.";
    }
  }

  if (values.scheduledEndAt && values.scheduledStartAt) {
    const start = new Date(values.scheduledStartAt).getTime();
    const end = new Date(values.scheduledEndAt).getTime();
    if (Number.isFinite(start) && Number.isFinite(end) && end < start) {
      errors.scheduledEndAt = "Scheduled end must be after start.";
    }
  }

  return errors;
}

export function isValidTransition(current: string, next: string) {
  if (current === next) {
    return true;
  }
  if (current === "SCHEDULED" && (next === "IN_PROGRESS" || next === "CANCELLED")) {
    return true;
  }
  if (current === "IN_PROGRESS" && next === "COMPLETED") {
    return true;
  }
  return false;
}
