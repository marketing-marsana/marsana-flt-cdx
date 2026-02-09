import { type SupabaseClient } from "@supabase/supabase-js";

import { PermissionRow, UserFormValues, UserProfileRecord } from "@/lib/users/types";

export type AuthAdminClient = {
  createUser: (params: { email: string; password: string }) => Promise<{ id: string }>;
  updateUser: (
    userId: string,
    params: { email?: string; password?: string; banDuration?: string | null },
  ) => Promise<void>;
};

export function createUserRepo(supabase: SupabaseClient, authAdmin: AuthAdminClient) {
  return {
    async getProfile(userId: string) {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("is_super_admin")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data;
    },
    async getUserProfile(userId: string) {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", userId)
        .is("deleted_at", null)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data as UserProfileRecord | null;
    },
    async findProfileByEmail(email: string, excludeUserId?: string) {
      let query = supabase
        .from("user_profiles")
        .select("user_id, email")
        .eq("email", email)
        .is("deleted_at", null)
        .limit(1);

      if (excludeUserId) {
        query = query.neq("user_id", excludeUserId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        throw error;
      }

      return data as { user_id: string; email: string } | null;
    },
    async createAuthUser(email: string, password: string) {
      return authAdmin.createUser({ email, password });
    },
    async updateAuthUser(userId: string, params: { email?: string; password?: string }) {
      await authAdmin.updateUser(userId, params);
    },
    async setAuthBan(userId: string, isActive: boolean) {
      await authAdmin.updateUser(userId, { banDuration: isActive ? null : "100y" });
    },
    async insertUserProfile(values: UserFormValues, userId: string) {
      const { data, error } = await supabase
        .from("user_profiles")
        .insert({
          user_id: userId,
          branch_id: values.isSuperAdmin ? null : values.branchId,
          full_name: values.fullName,
          email: values.email,
          phone: values.phone || null,
          designation: values.designation || null,
          is_super_admin: values.isSuperAdmin,
          is_active: values.status === "ACTIVE",
        })
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      return data as UserProfileRecord;
    },
    async updateUserProfile(values: UserFormValues, userId: string) {
      const { data, error } = await supabase
        .from("user_profiles")
        .update({
          branch_id: values.isSuperAdmin ? null : values.branchId,
          full_name: values.fullName,
          email: values.email,
          phone: values.phone || null,
          designation: values.designation || null,
          is_super_admin: values.isSuperAdmin,
          is_active: values.status === "ACTIVE",
        })
        .eq("user_id", userId)
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      return data as UserProfileRecord;
    },
    async softDeleteUser(userId: string) {
      const { error } = await supabase
        .from("user_profiles")
        .update({ deleted_at: new Date().toISOString(), is_active: false })
        .eq("user_id", userId);

      if (error) {
        throw error;
      }
    },
    async fetchPermissions(userId: string) {
      const { data, error } = await supabase
        .from("user_permissions")
        .select("module, can_view, can_create, can_edit, can_delete")
        .eq("user_id", userId);

      if (error) {
        throw error;
      }

      return data as PermissionRow[];
    },
    async replacePermissions(userId: string, permissions: PermissionRow[]) {
      const { error: deleteError } = await supabase
        .from("user_permissions")
        .delete()
        .eq("user_id", userId);
      if (deleteError) {
        throw deleteError;
      }

      const { error: insertError } = await supabase.from("user_permissions").insert(
        permissions.map((permission) => ({
          user_id: userId,
          module: permission.module,
          can_view: permission.can_view,
          can_create: permission.can_create,
          can_edit: permission.can_edit,
          can_delete: permission.can_delete,
        })),
      );

      if (insertError) {
        throw insertError;
      }
    },
    async insertAuditLog(payload: {
      userId: string;
      branchId: string | null;
      action: string;
      entityType: string;
      entityId: string | null;
      oldData?: Record<string, unknown> | null;
      newData?: Record<string, unknown> | null;
    }) {
      const { error } = await supabase.from("audit_logs").insert({
        user_id: payload.userId,
        branch_id: payload.branchId,
        action: payload.action,
        entity_type: payload.entityType,
        entity_id: payload.entityId,
        old_data: payload.oldData ?? null,
        new_data: payload.newData ?? null,
      });

      if (error) {
        throw error;
      }
    },
  };
}
