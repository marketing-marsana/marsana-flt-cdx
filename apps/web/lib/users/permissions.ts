import { PERMISSION_MODULES } from "@/lib/users/types";

export const DEFAULT_PERMISSIONS = PERMISSION_MODULES.map((module) => ({
  module,
  can_view: false,
  can_create: false,
  can_edit: false,
  can_delete: false,
}));
