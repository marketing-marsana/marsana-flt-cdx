import { type SupabaseClient } from "@supabase/supabase-js";

import { ExpenseFormValues, ExpenseRecord } from "@/lib/expenses/types";

export function createExpenseRepo(supabase: SupabaseClient) {
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
        .eq("module", "expenses")
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
    async findExpenseById(expenseId: string) {
      const { data, error } = await supabase
        .from("expense_logs")
        .select("*")
        .eq("id", expenseId)
        .is("deleted_at", null)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data as ExpenseRecord | null;
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
    async insertExpense(values: ExpenseFormValues) {
      const { data, error } = await supabase
        .from("expense_logs")
        .insert({
          branch_id: values.branchId,
          related_vehicle_id: values.relatedVehicleId || null,
          related_trip_id: values.relatedTripId || null,
          expense_date: values.expenseDate,
          category: values.category,
          description: values.description,
          amount: Number(values.amount),
          payment_method: values.paymentMethod,
          notes: values.notes || null,
        })
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      return data as ExpenseRecord;
    },
    async updateExpense(expenseId: string, values: ExpenseFormValues) {
      const { data, error } = await supabase
        .from("expense_logs")
        .update({
          branch_id: values.branchId,
          related_vehicle_id: values.relatedVehicleId || null,
          related_trip_id: values.relatedTripId || null,
          expense_date: values.expenseDate,
          category: values.category,
          description: values.description,
          amount: Number(values.amount),
          payment_method: values.paymentMethod,
          notes: values.notes || null,
        })
        .eq("id", expenseId)
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      return data as ExpenseRecord;
    },
    async softDeleteExpense(expenseId: string) {
      const { error } = await supabase
        .from("expense_logs")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", expenseId);

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
