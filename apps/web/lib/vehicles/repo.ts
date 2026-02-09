import { type SupabaseClient } from "@supabase/supabase-js";

import { VehicleFormValues, VehicleRecord } from "@/lib/vehicles/types";

export function createVehicleRepo(supabase: SupabaseClient) {
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
        .eq("module", "vehicles")
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
    async findVehicleById(vehicleId: string) {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("id", vehicleId)
        .is("deleted_at", null)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data as VehicleRecord | null;
    },
    async findVehicleByRegistration(
      branchId: string,
      registrationNumber: string,
      excludeId?: string,
    ) {
      let query = supabase
        .from("vehicles")
        .select("id, branch_id, registration_number")
        .eq("branch_id", branchId)
        .ilike("registration_number", registrationNumber)
        .is("deleted_at", null)
        .limit(1);

      if (excludeId) {
        query = query.neq("id", excludeId);
      }

      const { data, error } = await query.maybeSingle();
      if (error) {
        throw error;
      }

      return data as { id: string; branch_id: string; registration_number: string } | null;
    },
    async findVehicleByVin(vin: string, excludeId?: string) {
      if (!vin) {
        return null;
      }

      let query = supabase
        .from("vehicles")
        .select("id, vin")
        .eq("vin", vin)
        .is("deleted_at", null)
        .limit(1);

      if (excludeId) {
        query = query.neq("id", excludeId);
      }

      const { data, error } = await query.maybeSingle();
      if (error) {
        throw error;
      }

      return data as { id: string; vin: string } | null;
    },
    async insertVehicle(values: VehicleFormValues) {
      const { data, error } = await supabase
        .from("vehicles")
        .insert({
          branch_id: values.branchId,
          registration_number: values.registrationNumber,
          make: values.make || null,
          model: values.model || null,
          year: values.year ? Number(values.year) : null,
          color: values.color || null,
          vin: values.vin || null,
          fuel_type: values.fuelType || null,
          odometer: Number(values.odometer),
          status: values.status,
          notes: values.notes || null,
        })
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      return data as VehicleRecord;
    },
    async updateVehicle(vehicleId: string, values: VehicleFormValues) {
      const { data, error } = await supabase
        .from("vehicles")
        .update({
          branch_id: values.branchId,
          registration_number: values.registrationNumber,
          make: values.make || null,
          model: values.model || null,
          year: values.year ? Number(values.year) : null,
          color: values.color || null,
          vin: values.vin || null,
          fuel_type: values.fuelType || null,
          odometer: Number(values.odometer),
          status: values.status,
          notes: values.notes || null,
        })
        .eq("id", vehicleId)
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      return data as VehicleRecord;
    },
    async softDeleteVehicle(vehicleId: string) {
      const { error } = await supabase
        .from("vehicles")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", vehicleId);

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
