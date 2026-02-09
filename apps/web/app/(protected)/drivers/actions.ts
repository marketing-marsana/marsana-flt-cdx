"use server";

import { redirect } from "next/navigation";

import { createDriverRepo } from "@/lib/drivers/repo";
import { DriverFormValues } from "@/lib/drivers/types";
import { createDriver, deleteDriver, updateDriver } from "@/lib/drivers/service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type DriverActionState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof DriverFormValues, string>>;
};

function toDriverFormValues(formData: FormData): DriverFormValues {
  return {
    branchId: String(formData.get("branchId") ?? ""),
    fullName: String(formData.get("fullName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    licenseNumber: String(formData.get("licenseNumber") ?? ""),
    licenseExpiryDate: String(formData.get("licenseExpiryDate") ?? ""),
    status: (formData.get("status") as DriverFormValues["status"]) ?? "ACTIVE",
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

export async function createDriverAction(
  _prev: DriverActionState,
  formData: FormData,
): Promise<DriverActionState> {
  const { supabase, user } = await requireUser();
  const repo = createDriverRepo(supabase);
  const values = toDriverFormValues(formData);

  const result = await createDriver(repo, user.id, values);

  if (result.fieldErrors) {
    return { fieldErrors: result.fieldErrors };
  }

  if (result.error) {
    return { error: result.error };
  }

  if (result.driverId) {
    redirect(`/drivers/${result.driverId}`);
  }

  return {};
}

export async function updateDriverAction(
  _prev: DriverActionState,
  formData: FormData,
): Promise<DriverActionState> {
  const { supabase, user } = await requireUser();
  const repo = createDriverRepo(supabase);
  const driverId = String(formData.get("driverId") ?? "");

  if (!driverId) {
    return { error: "Driver ID is missing." };
  }

  const values = toDriverFormValues(formData);
  const result = await updateDriver(repo, user.id, driverId, values);

  if (result.fieldErrors) {
    return { fieldErrors: result.fieldErrors };
  }

  if (result.error) {
    return { error: result.error };
  }

  if (result.driverId) {
    redirect(`/drivers/${result.driverId}`);
  }

  return {};
}

export async function deleteDriverAction(
  _prev: DriverActionState,
  formData: FormData,
): Promise<DriverActionState> {
  const { supabase, user } = await requireUser();
  const repo = createDriverRepo(supabase);
  const driverId = String(formData.get("driverId") ?? "");
  const confirmName = String(formData.get("confirmName") ?? "").trim();

  if (!driverId) {
    return { error: "Driver ID is missing." };
  }

  if (!confirmName) {
    return { error: "Please type the driver name to confirm deletion." };
  }

  const existing = await repo.findDriverById(driverId);
  if (!existing) {
    return { error: "Driver not found." };
  }

  if (existing.full_name !== confirmName) {
    return { error: "Driver name confirmation does not match." };
  }

  const result = await deleteDriver(repo, user.id, driverId);

  if (result.error) {
    return { error: result.error };
  }

  redirect("/drivers");
}
