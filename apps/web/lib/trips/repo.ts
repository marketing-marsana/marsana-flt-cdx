import { type SupabaseClient } from "@supabase/supabase-js";

import { TripFormValues, TripRecord } from "@/lib/trips/types";

export function createTripRepo(supabase: SupabaseClient) {
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
        .eq("module", "trips")
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
    async findTripById(tripId: string) {
      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .eq("id", tripId)
        .is("deleted_at", null)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data as TripRecord | null;
    },
    async findTripByCode(branchId: string, tripCode: string, excludeId?: string) {
      let query = supabase
        .from("trips")
        .select("id, branch_id, trip_code")
        .eq("branch_id", branchId)
        .ilike("trip_code", tripCode)
        .is("deleted_at", null)
        .limit(1);

      if (excludeId) {
        query = query.neq("id", excludeId);
      }

      const { data, error } = await query.maybeSingle();
      if (error) {
        throw error;
      }

      return data as { id: string; branch_id: string; trip_code: string } | null;
    },
    async getDriver(driverId: string) {
      const { data, error } = await supabase
        .from("drivers")
        .select("id, branch_id")
        .eq("id", driverId)
        .is("deleted_at", null)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data as { id: string; branch_id: string } | null;
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
    async findOverlappingTrips(payload: {
      branchId: string;
      driverId: string;
      vehicleId: string;
      startAt: string;
      endAt: string | null;
      excludeId?: string;
    }) {
      const start = payload.startAt;
      const end = payload.endAt ?? null;

      let query = supabase
        .from("trips")
        .select("id, driver_id, vehicle_id, scheduled_start_at, scheduled_end_at, status")
        .eq("branch_id", payload.branchId)
        .in("status", ["SCHEDULED", "IN_PROGRESS"])
        .is("deleted_at", null)
        .or(`driver_id.eq.${payload.driverId},vehicle_id.eq.${payload.vehicleId}`);

      if (payload.excludeId) {
        query = query.neq("id", payload.excludeId);
      }

      const { data, error } = await query;
      if (error) {
        throw error;
      }

      if (!data) {
        return [];
      }

      return data.filter((trip) => {
        const tripStart = new Date(trip.scheduled_start_at).getTime();
        const tripEnd = trip.scheduled_end_at ? new Date(trip.scheduled_end_at).getTime() : null;
        const newStart = new Date(start).getTime();
        const newEnd = end ? new Date(end).getTime() : null;

        if (!Number.isFinite(tripStart) || !Number.isFinite(newStart)) {
          return false;
        }

        if (newEnd === null) {
          return tripEnd === null || tripEnd >= newStart;
        }

        return tripStart <= newEnd && (tripEnd === null || tripEnd >= newStart);
      });
    },
    async insertTrip(values: TripFormValues) {
      const { data, error } = await supabase
        .from("trips")
        .insert({
          branch_id: values.branchId,
          driver_id: values.driverId,
          vehicle_id: values.vehicleId,
          trip_code: values.tripCode,
          customer_name: values.customerName || null,
          customer_phone: values.customerPhone || null,
          pickup_location: values.pickupLocation,
          dropoff_location: values.dropoffLocation,
          scheduled_start_at: values.scheduledStartAt,
          scheduled_end_at: values.scheduledEndAt || null,
          actual_start_at: values.actualStartAt || null,
          actual_end_at: values.actualEndAt || null,
          distance_km: values.distanceKm ? Number(values.distanceKm) : null,
          fare_amount: values.fareAmount ? Number(values.fareAmount) : null,
          status: values.status,
          notes: values.notes || null,
        })
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      return data as TripRecord;
    },
    async updateTrip(tripId: string, values: TripFormValues) {
      const { data, error } = await supabase
        .from("trips")
        .update({
          branch_id: values.branchId,
          driver_id: values.driverId,
          vehicle_id: values.vehicleId,
          trip_code: values.tripCode,
          customer_name: values.customerName || null,
          customer_phone: values.customerPhone || null,
          pickup_location: values.pickupLocation,
          dropoff_location: values.dropoffLocation,
          scheduled_start_at: values.scheduledStartAt,
          scheduled_end_at: values.scheduledEndAt || null,
          actual_start_at: values.actualStartAt || null,
          actual_end_at: values.actualEndAt || null,
          distance_km: values.distanceKm ? Number(values.distanceKm) : null,
          fare_amount: values.fareAmount ? Number(values.fareAmount) : null,
          status: values.status,
          notes: values.notes || null,
        })
        .eq("id", tripId)
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      return data as TripRecord;
    },
    async softDeleteTrip(tripId: string) {
      const { error } = await supabase
        .from("trips")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", tripId);

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
