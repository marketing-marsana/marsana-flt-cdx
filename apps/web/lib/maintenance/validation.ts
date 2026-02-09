import { MaintenanceFieldErrors, MaintenanceFormValues } from "@/lib/maintenance/types";

export function normalizeMaintenanceInput(values: MaintenanceFormValues): MaintenanceFormValues {
  return {
    branchId: values.branchId.trim(),
    vehicleId: values.vehicleId.trim(),
    tripId: values.tripId.trim(),
    serviceDate: values.serviceDate,
    maintenanceType: values.maintenanceType,
    description: values.description.trim(),
    vendorOrWorkshop: values.vendorOrWorkshop.trim(),
    costAmount: values.costAmount.trim(),
    odometer: values.odometer.trim(),
    nextServiceOdometer: values.nextServiceOdometer.trim(),
    nextServiceDate: values.nextServiceDate.trim(),
    notes: values.notes.trim(),
  };
}

export function validateMaintenanceInput(values: MaintenanceFormValues): MaintenanceFieldErrors {
  const errors: MaintenanceFieldErrors = {};

  if (!values.branchId) {
    errors.branchId = "Branch assignment is required.";
  }

  if (!values.vehicleId) {
    errors.vehicleId = "Vehicle selection is required.";
  }

  if (!values.serviceDate) {
    errors.serviceDate = "Service date is required.";
  }

  if (!values.maintenanceType) {
    errors.maintenanceType = "Maintenance type is required.";
  }

  if (!values.description) {
    errors.description = "Description is required.";
  }

  if (!values.costAmount) {
    errors.costAmount = "Cost amount is required.";
  }

  const costAmount = Number(values.costAmount);
  if (values.costAmount && (!Number.isFinite(costAmount) || costAmount < 0)) {
    errors.costAmount = "Cost must be zero or more.";
  }

  if (!values.odometer) {
    errors.odometer = "Odometer is required.";
  }

  const odometer = Number(values.odometer);
  if (values.odometer && (!Number.isFinite(odometer) || odometer < 0)) {
    errors.odometer = "Odometer must be zero or more.";
  }

  if (values.nextServiceOdometer) {
    const nextOdometer = Number(values.nextServiceOdometer);
    if (!Number.isFinite(nextOdometer) || nextOdometer < 0) {
      errors.nextServiceOdometer = "Next service odometer must be zero or more.";
    }
  }

  return errors;
}
