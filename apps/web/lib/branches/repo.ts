import { type SupabaseClient } from "@supabase/supabase-js";

import { BranchFormValues, BranchRecord } from "@/lib/branches/types";

const RELATED_TABLES = [
  "vehicles",
  "handshakes",
  "inspections",
  "rentals",
  "maintenance_tickets",
  "corporates",
  "alerts",
];

function isMissingTableError(error: { message?: string; code?: string } | null) {
  if (!error) {
    return false;
  }
  return (
    error.code === "42P01" ||
    Boolean(error.message && /relation .* does not exist/i.test(error.message))
  );
}

export function createBranchRepo(supabase: SupabaseClient) {
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
    async findBranchById(branchId: string) {
      const { data, error } = await supabase
        .from("branches")
        .select("*")
        .eq("id", branchId)
        .is("deleted_at", null)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data as BranchRecord | null;
    },
    async findBranchByName(name: string, excludeId?: string) {
      let query = supabase
        .from("branches")
        .select(
          "id, name, code, type, address, contact_number, status, created_at, updated_at, deleted_at",
        )
        .ilike("name", name)
        .is("deleted_at", null)
        .limit(1);

      if (excludeId) {
        query = query.neq("id", excludeId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        throw error;
      }

      return data as BranchRecord | null;
    },
    async findBranchByCode(code: string, excludeId?: string) {
      let query = supabase
        .from("branches")
        .select(
          "id, name, code, type, address, contact_number, status, created_at, updated_at, deleted_at",
        )
        .ilike("code", code)
        .is("deleted_at", null)
        .limit(1);

      if (excludeId) {
        query = query.neq("id", excludeId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        throw error;
      }

      return data as BranchRecord | null;
    },
    async insertBranch(values: BranchFormValues) {
      const { data, error } = await supabase
        .from("branches")
        .insert({
          name: values.name,
          code: values.code,
          type: values.type,
          address: values.address || null,
          contact_number: values.contactNumber || null,
          status: values.status,
        })
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      return data as BranchRecord;
    },
    async updateBranch(branchId: string, values: BranchFormValues) {
      const { data, error } = await supabase
        .from("branches")
        .update({
          name: values.name,
          code: values.code,
          type: values.type,
          address: values.address || null,
          contact_number: values.contactNumber || null,
          status: values.status,
        })
        .eq("id", branchId)
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      return data as BranchRecord;
    },
    async softDeleteBranch(branchId: string) {
      const { error } = await supabase
        .from("branches")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", branchId);

      if (error) {
        throw error;
      }
    },
    async countActiveUsers(branchId: string) {
      const { count, error } = await supabase
        .from("user_profiles")
        .select("id", { count: "exact", head: true })
        .eq("branch_id", branchId)
        .eq("is_active", true)
        .is("deleted_at", null);

      if (error) {
        throw error;
      }

      return count ?? 0;
    },
    async countRelatedRecords(branchId: string) {
      let total = 0;

      for (const table of RELATED_TABLES) {
        const { count, error } = await supabase
          .from(table)
          .select("id", { count: "exact", head: true })
          .eq("branch_id", branchId);

        if (error) {
          if (isMissingTableError(error)) {
            continue;
          }
          throw error;
        }

        total += count ?? 0;
      }

      return total;
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
