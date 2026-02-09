import { DriverFieldErrors, DriverFormValues } from "@/lib/drivers/types";

export function normalizeDriverInput(values: DriverFormValues): DriverFormValues {
  return {
    branchId: values.branchId.trim(),
    fullName: values.fullName.trim(),
    phone: values.phone.trim(),
    licenseNumber: values.licenseNumber.trim().toUpperCase(),
    licenseExpiryDate: values.licenseExpiryDate,
    status: values.status,
    notes: values.notes.trim(),
  };
}

export function validateDriverInput(values: DriverFormValues): DriverFieldErrors {
  const errors: DriverFieldErrors = {};

  if (!values.fullName) {
    errors.fullName = "Full name is required.";
  }

  if (!values.phone) {
    errors.phone = "Phone number is required.";
  }

  if (!values.licenseNumber) {
    errors.licenseNumber = "License number is required.";
  }

  if (!values.branchId) {
    errors.branchId = "Branch assignment is required.";
  }

  if (!values.status) {
    errors.status = "Status is required.";
  }

  return errors;
}
