import { UserFieldErrors, UserFormValues } from "@/lib/users/types";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function normalizeUserInput(values: UserFormValues): UserFormValues {
  return {
    ...values,
    fullName: values.fullName.trim(),
    email: values.email.trim().toLowerCase(),
    phone: values.phone.trim(),
    designation: values.designation.trim(),
    branchId: values.branchId.trim(),
  };
}

export function validateUserInput(
  values: UserFormValues,
  mode: "create" | "edit",
): UserFieldErrors {
  const errors: UserFieldErrors = {};

  if (!values.fullName) {
    errors.fullName = "Full name is required.";
  }

  if (!values.email || !isValidEmail(values.email)) {
    errors.email = "A valid email is required.";
  }

  if (mode === "create" && (!values.password || values.password.length < 8)) {
    errors.password = "Password must be at least 8 characters.";
  }

  if (mode === "edit" && values.resetPassword && values.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }

  if (!values.isSuperAdmin && !values.branchId) {
    errors.branchId = "Branch assignment is required for non-super admins.";
  }

  const hasView = values.permissions.some((perm) => perm.can_view);
  if (!hasView) {
    errors.permissions = "At least one module must have view permission.";
  }

  return errors;
}
