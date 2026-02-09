import { type SupabaseClient } from "@supabase/supabase-js";

import { DriverFormValues, DriverRecord } from "@/lib/drivers/types";

export function createDriverRepo(supabase: SupabaseClient) {
  return {
    async getProfile(userId: string) {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("is_super_admin, branch_id")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data as { is_super_admin: boolean; branch_id: string | null } | null;
    },
    async getPermission(userId: string) {
      const { data, error } = await supabase
        .from("user_permissions")
        .select("can_view, can_create, can_edit, can_delete")
        .eq("user_id", userId)
        .eq("module", "drivers")
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data as {
        can_view: boolean;
        can_create: boolean;
        can_edit: boolean;
        can_delete: boolean;
      } | null;
    },
    async findDriverById(driverId: string) {
      const { data, error } = await supabase
        .from("drivers")
        .select("*")
        .eq("id", driverId)
        .is("deleted_at", null)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data as DriverRecord | null;
    },
    async findDriverByLicense(branchId: string, licenseNumber: string, excludeId?: string) {
      let query = supabase
        .from("drivers")
        .select("id, branch_id, license_number")
        .eq("branch_id", branchId)
        .ilike("license_number", licenseNumber)
        .is("deleted_at", null)
        .limit(1);

      if (excludeId) {
        query = query.neq("id", excludeId);
      }

      const { data, error } = await query.maybeSingle();
      if (error) {
        throw error;
      }

      return data as { id: string; branch_id: string; license_number: string } | null;
    },
    async insertDriver(values: DriverFormValues) {
      const { data, error } = await supabase
        .from("drivers")
        .insert({
          branch_id: values.branchId,
          full_name: values.fullName,
          phone: values.phone,
          license_number: values.licenseNumber,
          license_expiry_date: values.licenseExpiryDate || null,
          status: values.status,
          notes: values.notes || null,
        })
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      return data as DriverRecord;
    },
    async updateDriver(driverId: string, values: DriverFormValues) {
      const { data, error } = await supabase
        .from("drivers")
        .update({
          branch_id: values.branchId,
          full_name: values.fullName,
          phone: values.phone,
          license_number: values.licenseNumber,
          license_expiry_date: values.licenseExpiryDate || null,
          status: values.status,
          notes: values.notes || null,
        })
        .eq("id", driverId)
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      return data as DriverRecord;
    },
    async softDeleteDriver(driverId: string) {
      const { error } = await supabase
        .from("drivers")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", driverId);

      if (error) {
        throw error;
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
