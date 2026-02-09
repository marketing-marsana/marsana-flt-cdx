export type PermissionModule =
  | "branches"
  | "users"
  | "drivers"
  | "vehicles"
  | "trips"
  | "fuel"
  | "expenses"
  | "handshakes"
  | "inspections"
  | "rentals"
  | "maintenance"
  | "corporates"
  | "alerts"
  | "dashboards"
  | "driver_portal"
  | "audit_logs"
  | "reports"
  | "settings";

export const PERMISSION_MODULES: PermissionModule[] = [
  "branches",
  "users",
  "drivers",
  "vehicles",
  "trips",
  "fuel",
  "expenses",
  "handshakes",
  "inspections",
  "rentals",
  "maintenance",
  "corporates",
  "alerts",
  "dashboards",
  "driver_portal",
  "audit_logs",
  "reports",
  "settings",
];

export type PermissionRow = {
  module: PermissionModule;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
};

export type UserFormValues = {
  fullName: string;
  email: string;
  phone: string;
  branchId: string;
  designation: string;
  status: "ACTIVE" | "INACTIVE";
  password: string;
  resetPassword: boolean;
  isSuperAdmin: boolean;
  permissions: PermissionRow[];
};

export type UserProfileRecord = {
  id: string;
  user_id: string;
  branch_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  designation: string | null;
  is_super_admin: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type UserFieldErrors = Partial<Record<keyof UserFormValues, string>>;
