import { BranchFieldErrors, BranchFormValues } from "@/lib/branches/types";

export function normalizeBranchInput(values: BranchFormValues): BranchFormValues {
  return {
    name: values.name.trim(),
    code: values.code.trim().toUpperCase(),
    type: values.type,
    address: values.address.trim(),
    contactNumber: values.contactNumber.trim(),
    status: values.status,
  };
}

export function validateBranchInput(values: BranchFormValues): BranchFieldErrors {
  const errors: BranchFieldErrors = {};

  if (!values.name) {
    errors.name = "Branch name is required.";
  }

  if (!values.code) {
    errors.code = "Branch code is required.";
  }

  if (!values.type) {
    errors.type = "Branch type is required.";
  }

  if (!values.status) {
    errors.status = "Status is required.";
  }

  return errors;
}
