"use server";

import { redirect } from "next/navigation";

import { createVehicleRepo } from "@/lib/vehicles/repo";
import { VehicleFormValues } from "@/lib/vehicles/types";
import { createVehicle, deleteVehicle, updateVehicle } from "@/lib/vehicles/service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type VehicleActionState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof VehicleFormValues, string>>;
};

function toVehicleFormValues(formData: FormData): VehicleFormValues {
  return {
    branchId: String(formData.get("branchId") ?? ""),
    registrationNumber: String(formData.get("registrationNumber") ?? ""),
    make: String(formData.get("make") ?? ""),
    model: String(formData.get("model") ?? ""),
    year: String(formData.get("year") ?? ""),
    color: String(formData.get("color") ?? ""),
    vin: String(formData.get("vin") ?? ""),
    fuelType: String(formData.get("fuelType") ?? ""),
    odometer: String(formData.get("odometer") ?? ""),
    status: (formData.get("status") as VehicleFormValues["status"]) ?? "ACTIVE",
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

export async function createVehicleAction(
  _prev: VehicleActionState,
  formData: FormData,
): Promise<VehicleActionState> {
  const { supabase, user } = await requireUser();
  const repo = createVehicleRepo(supabase);
  const values = toVehicleFormValues(formData);

  const result = await createVehicle(repo, user.id, values);

  if (result.fieldErrors) {
    return { fieldErrors: result.fieldErrors };
  }

  if (result.error) {
    return { error: result.error };
  }

  if (result.vehicleId) {
    redirect(`/vehicles/${result.vehicleId}`);
  }

  return {};
}

export async function updateVehicleAction(
  _prev: VehicleActionState,
  formData: FormData,
): Promise<VehicleActionState> {
  const { supabase, user } = await requireUser();
  const repo = createVehicleRepo(supabase);
  const vehicleId = String(formData.get("vehicleId") ?? "");

  if (!vehicleId) {
    return { error: "Vehicle ID is missing." };
  }

  const values = toVehicleFormValues(formData);
  const result = await updateVehicle(repo, user.id, vehicleId, values);

  if (result.fieldErrors) {
    return { fieldErrors: result.fieldErrors };
  }

  if (result.error) {
    return { error: result.error };
  }

  if (result.vehicleId) {
    redirect(`/vehicles/${result.vehicleId}`);
  }

  return {};
}

export async function deleteVehicleAction(
  _prev: VehicleActionState,
  formData: FormData,
): Promise<VehicleActionState> {
  const { supabase, user } = await requireUser();
  const repo = createVehicleRepo(supabase);
  const vehicleId = String(formData.get("vehicleId") ?? "");
  const confirmValue = String(formData.get("confirmValue") ?? "").trim();

  if (!vehicleId) {
    return { error: "Vehicle ID is missing." };
  }

  if (!confirmValue) {
    return { error: "Please type the registration number to confirm deletion." };
  }

  const existing = await repo.findVehicleById(vehicleId);
  if (!existing) {
    return { error: "Vehicle not found." };
  }

  if (existing.registration_number !== confirmValue) {
    return { error: "Registration number confirmation does not match." };
  }

  const result = await deleteVehicle(repo, user.id, vehicleId);

  if (result.error) {
    return { error: result.error };
  }

  redirect("/vehicles");
}
