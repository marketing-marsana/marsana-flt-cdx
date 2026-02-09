import { type SupabaseClient } from "@supabase/supabase-js";

import { MaintenanceFormValues, MaintenanceRecord } from "@/lib/maintenance/types";

export function createMaintenanceRepo(supabase: SupabaseClient) {
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
        .eq("module", "maintenance")
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
    async findMaintenanceById(maintenanceId: string) {
      const { data, error } = await supabase
        .from("maintenance_logs")
        .select("*")
        .eq("id", maintenanceId)
        .is("deleted_at", null)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data as MaintenanceRecord | null;
    },
    async getVehicle(vehicleId: string) {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, branch_id")
        .eq("id", vehicleId)
        .is("deleted_at", null)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data as { id: string; branch_id: string } | null;
    },
    async getTrip(tripId: string) {
      const { data, error } = await supabase
        .from("trips")
        .select("id, branch_id, vehicle_id")
        .eq("id", tripId)
        .is("deleted_at", null)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data as { id: string; branch_id: string; vehicle_id: string } | null;
    },
    async getLatestMaintenanceOdometer(vehicleId: string, excludeId?: string) {
      let query = supabase
        .from("maintenance_logs")
        .select("odometer")
        .eq("vehicle_id", vehicleId)
        .is("deleted_at", null)
        .order("odometer", { ascending: false })
        .limit(1);

      if (excludeId) {
        query = query.neq("id", excludeId);
      }

      const { data, error } = await query.maybeSingle();
      if (error) {
        throw error;
      }

      return data as { odometer: number } | null;
    },
    async getLatestFuelOdometer(vehicleId: string) {
      const { data, error } = await supabase
        .from("fuel_logs")
        .select("odometer")
        .eq("vehicle_id", vehicleId)
        .is("deleted_at", null)
        .order("odometer", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data as { odometer: number } | null;
    },
    async insertMaintenance(values: MaintenanceFormValues) {
      const { data, error } = await supabase
        .from("maintenance_logs")
        .insert({
          branch_id: values.branchId,
          vehicle_id: values.vehicleId,
          trip_id: values.tripId || null,
          service_date: values.serviceDate,
          maintenance_type: values.maintenanceType,
          description: values.description,
          vendor_or_workshop: values.vendorOrWorkshop || null,
          cost_amount: Number(values.costAmount),
          odometer: Number(values.odometer),
          next_service_odometer: values.nextServiceOdometer
            ? Number(values.nextServiceOdometer)
            : null,
          next_service_date: values.nextServiceDate || null,
          notes: values.notes || null,
        })
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      return data as MaintenanceRecord;
    },
    async updateMaintenance(maintenanceId: string, values: MaintenanceFormValues) {
      const { data, error } = await supabase
        .from("maintenance_logs")
        .update({
          branch_id: values.branchId,
          vehicle_id: values.vehicleId,
          trip_id: values.tripId || null,
          service_date: values.serviceDate,
          maintenance_type: values.maintenanceType,
          description: values.description,
          vendor_or_workshop: values.vendorOrWorkshop || null,
          cost_amount: Number(values.costAmount),
          odometer: Number(values.odometer),
          next_service_odometer: values.nextServiceOdometer
            ? Number(values.nextServiceOdometer)
            : null,
          next_service_date: values.nextServiceDate || null,
          notes: values.notes || null,
        })
        .eq("id", maintenanceId)
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      return data as MaintenanceRecord;
    },
    async softDeleteMaintenance(maintenanceId: string) {
      const { error } = await supabase
        .from("maintenance_logs")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", maintenanceId);

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
