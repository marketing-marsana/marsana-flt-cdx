import { type SupabaseClient } from "@supabase/supabase-js";

import { FuelFormValues, FuelRecord } from "@/lib/fuel/types";

export function createFuelRepo(supabase: SupabaseClient) {
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
        .eq("module", "fuel")
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
    async findFuelLogById(fuelId: string) {
      const { data, error } = await supabase
        .from("fuel_logs")
        .select("*")
        .eq("id", fuelId)
        .is("deleted_at", null)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data as FuelRecord | null;
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
    async getLatestOdometer(vehicleId: string, excludeId?: string) {
      let query = supabase
        .from("fuel_logs")
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
    async insertFuelLog(values: FuelFormValues) {
      const { data, error } = await supabase
        .from("fuel_logs")
        .insert({
          branch_id: values.branchId,
          vehicle_id: values.vehicleId,
          trip_id: values.tripId || null,
          filled_at: values.filledAt,
          quantity_liters: Number(values.quantityLiters),
          price_per_liter: Number(values.pricePerLiter),
          total_amount: Number(values.totalAmount),
          odometer: Number(values.odometer),
          fuel_station: values.fuelStation || null,
          notes: values.notes || null,
        })
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      return data as FuelRecord;
    },
    async updateFuelLog(fuelId: string, values: FuelFormValues) {
      const { data, error } = await supabase
        .from("fuel_logs")
        .update({
          branch_id: values.branchId,
          vehicle_id: values.vehicleId,
          trip_id: values.tripId || null,
          filled_at: values.filledAt,
          quantity_liters: Number(values.quantityLiters),
          price_per_liter: Number(values.pricePerLiter),
          total_amount: Number(values.totalAmount),
          odometer: Number(values.odometer),
          fuel_station: values.fuelStation || null,
          notes: values.notes || null,
        })
        .eq("id", fuelId)
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      return data as FuelRecord;
    },
    async softDeleteFuelLog(fuelId: string) {
      const { error } = await supabase
        .from("fuel_logs")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", fuelId);

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
