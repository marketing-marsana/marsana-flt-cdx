import { VehicleFieldErrors, VehicleFormValues } from "@/lib/vehicles/types";

export function normalizeVehicleInput(values: VehicleFormValues): VehicleFormValues {
  return {
    branchId: values.branchId.trim(),
    registrationNumber: values.registrationNumber.trim().toUpperCase(),
    make: values.make.trim(),
    model: values.model.trim(),
    year: values.year.trim(),
    color: values.color.trim(),
    vin: values.vin.trim().toUpperCase(),
    fuelType: values.fuelType.trim(),
    odometer: values.odometer.trim(),
    status: values.status,
    notes: values.notes.trim(),
  };
}

export function validateVehicleInput(values: VehicleFormValues): VehicleFieldErrors {
  const errors: VehicleFieldErrors = {};

  if (!values.branchId) {
    errors.branchId = "Branch assignment is required.";
  }

  if (!values.registrationNumber) {
    errors.registrationNumber = "Registration number is required.";
  }

  if (values.odometer === "") {
    errors.odometer = "Odometer is required.";
  } else {
    const odometerValue = Number(values.odometer);
    if (!Number.isFinite(odometerValue) || odometerValue < 0) {
      errors.odometer = "Odometer must be a non-negative number.";
    }
  }

  if (!values.status) {
    errors.status = "Status is required.";
  }

  if (values.year) {
    const yearValue = Number(values.year);
    if (!Number.isInteger(yearValue) || yearValue < 1900 || yearValue > 2100) {
      errors.year = "Year must be a valid number.";
    }
  }

  return errors;
}
