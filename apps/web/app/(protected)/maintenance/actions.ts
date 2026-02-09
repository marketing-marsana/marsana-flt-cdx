"use server";

import { redirect } from "next/navigation";

import { createMaintenanceRepo } from "@/lib/maintenance/repo";
import { MaintenanceFormValues } from "@/lib/maintenance/types";
import { createMaintenance, deleteMaintenance, updateMaintenance } from "@/lib/maintenance/service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type MaintenanceActionState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof MaintenanceFormValues, string>>;
};

function toMaintenanceFormValues(formData: FormData): MaintenanceFormValues {
  return {
    branchId: String(formData.get("branchId") ?? ""),
    vehicleId: String(formData.get("vehicleId") ?? ""),
    tripId: String(formData.get("tripId") ?? ""),
    serviceDate: String(formData.get("serviceDate") ?? ""),
    maintenanceType:
      (formData.get("maintenanceType") as MaintenanceFormValues["maintenanceType"]) ?? "service",
    description: String(formData.get("description") ?? ""),
    vendorOrWorkshop: String(formData.get("vendorOrWorkshop") ?? ""),
    costAmount: String(formData.get("costAmount") ?? ""),
    odometer: String(formData.get("odometer") ?? ""),
    nextServiceOdometer: String(formData.get("nextServiceOdometer") ?? ""),
    nextServiceDate: String(formData.get("nextServiceDate") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  };
}

async function requireUser() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { supabase, user };
}

export async function createMaintenanceAction(
  _prev: MaintenanceActionState,
  formData: FormData,
): Promise<MaintenanceActionState> {
  const { supabase, user } = await requireUser();
  const repo = createMaintenanceRepo(supabase);
  const values = toMaintenanceFormValues(formData);

  const result = await createMaintenance(repo, user.id, values);

  if (result.fieldErrors) {
    return { fieldErrors: result.fieldErrors };
  }

  if (result.error) {
    return { error: result.error };
  }

  if (result.maintenanceId) {
    redirect(`/maintenance/${result.maintenanceId}`);
  }

  return {};
}

export async function updateMaintenanceAction(
  _prev: MaintenanceActionState,
  formData: FormData,
): Promise<MaintenanceActionState> {
  const { supabase, user } = await requireUser();
  const repo = createMaintenanceRepo(supabase);
  const maintenanceId = String(formData.get("maintenanceId") ?? "");

  if (!maintenanceId) {
    return { error: "Maintenance log ID is missing." };
  }

  const values = toMaintenanceFormValues(formData);
  const result = await updateMaintenance(repo, user.id, maintenanceId, values);

  if (result.fieldErrors) {
    return { fieldErrors: result.fieldErrors };
  }

  if (result.error) {
    return { error: result.error };
  }

  if (result.maintenanceId) {
    redirect(`/maintenance/${result.maintenanceId}`);
  }

  return {};
}

export async function deleteMaintenanceAction(
  _prev: MaintenanceActionState,
  formData: FormData,
): Promise<MaintenanceActionState> {
  const { supabase, user } = await requireUser();
  const repo = createMaintenanceRepo(supabase);
  const maintenanceId = String(formData.get("maintenanceId") ?? "");
  const confirmLabel = String(formData.get("confirmLabel") ?? "").trim();

  if (!maintenanceId) {
    return { error: "Maintenance log ID is missing." };
  }

  if (!confirmLabel) {
    return { error: "Please type the maintenance log label to confirm deletion." };
  }

  const existing = await repo.findMaintenanceById(maintenanceId);
  if (!existing) {
    return { error: "Maintenance log not found." };
  }

  if (confirmLabel !== existing.id) {
    return { error: "Maintenance log label confirmation does not match." };
  }

  const result = await deleteMaintenance(repo, user.id, maintenanceId);

  if (result.error) {
    return { error: result.error };
  }

  redirect("/maintenance");
}
