"use server";

import { redirect } from "next/navigation";

import { createFuelRepo } from "@/lib/fuel/repo";
import { FuelFormValues } from "@/lib/fuel/types";
import { createFuelLog, deleteFuelLog, updateFuelLog } from "@/lib/fuel/service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type FuelActionState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof FuelFormValues, string>>;
};

function toFuelFormValues(formData: FormData): FuelFormValues {
  return {
    branchId: String(formData.get("branchId") ?? ""),
    vehicleId: String(formData.get("vehicleId") ?? ""),
    tripId: String(formData.get("tripId") ?? ""),
    filledAt: String(formData.get("filledAt") ?? ""),
    quantityLiters: String(formData.get("quantityLiters") ?? ""),
    pricePerLiter: String(formData.get("pricePerLiter") ?? ""),
    totalAmount: String(formData.get("totalAmount") ?? ""),
    odometer: String(formData.get("odometer") ?? ""),
    fuelStation: String(formData.get("fuelStation") ?? ""),
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

export async function createFuelLogAction(
  _prev: FuelActionState,
  formData: FormData,
): Promise<FuelActionState> {
  const { supabase, user } = await requireUser();
  const repo = createFuelRepo(supabase);
  const values = toFuelFormValues(formData);

  const result = await createFuelLog(repo, user.id, values);

  if (result.fieldErrors) {
    return { fieldErrors: result.fieldErrors };
  }

  if (result.error) {
    return { error: result.error };
  }

  if (result.fuelId) {
    redirect(`/fuel/${result.fuelId}`);
  }

  return {};
}

export async function updateFuelLogAction(
  _prev: FuelActionState,
  formData: FormData,
): Promise<FuelActionState> {
  const { supabase, user } = await requireUser();
  const repo = createFuelRepo(supabase);
  const fuelId = String(formData.get("fuelId") ?? "");

  if (!fuelId) {
    return { error: "Fuel log ID is missing." };
  }

  const values = toFuelFormValues(formData);
  const result = await updateFuelLog(repo, user.id, fuelId, values);

  if (result.fieldErrors) {
    return { fieldErrors: result.fieldErrors };
  }

  if (result.error) {
    return { error: result.error };
  }

  if (result.fuelId) {
    redirect(`/fuel/${result.fuelId}`);
  }

  return {};
}

export async function deleteFuelLogAction(
  _prev: FuelActionState,
  formData: FormData,
): Promise<FuelActionState> {
  const { supabase, user } = await requireUser();
  const repo = createFuelRepo(supabase);
  const fuelId = String(formData.get("fuelId") ?? "");
  const confirmLabel = String(formData.get("confirmLabel") ?? "").trim();

  if (!fuelId) {
    return { error: "Fuel log ID is missing." };
  }

  if (!confirmLabel) {
    return { error: "Please type the fuel log label to confirm deletion." };
  }

  const existing = await repo.findFuelLogById(fuelId);
  if (!existing) {
    return { error: "Fuel log not found." };
  }

  if (confirmLabel !== existing.id) {
    return { error: "Fuel log label confirmation does not match." };
  }

  const result = await deleteFuelLog(repo, user.id, fuelId);

  if (result.error) {
    return { error: result.error };
  }

  redirect("/fuel");
}
