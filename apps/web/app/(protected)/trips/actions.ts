"use server";

import { redirect } from "next/navigation";

import { createTripRepo } from "@/lib/trips/repo";
import { TripFormValues } from "@/lib/trips/types";
import {
  cancelTrip,
  completeTrip,
  createTrip,
  deleteTrip,
  startTrip,
  updateTrip,
} from "@/lib/trips/service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type TripActionState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof TripFormValues, string>>;
};

function toTripFormValues(formData: FormData): TripFormValues {
  return {
    branchId: String(formData.get("branchId") ?? ""),
    driverId: String(formData.get("driverId") ?? ""),
    vehicleId: String(formData.get("vehicleId") ?? ""),
    tripCode: String(formData.get("tripCode") ?? ""),
    customerName: String(formData.get("customerName") ?? ""),
    customerPhone: String(formData.get("customerPhone") ?? ""),
    pickupLocation: String(formData.get("pickupLocation") ?? ""),
    dropoffLocation: String(formData.get("dropoffLocation") ?? ""),
    scheduledStartAt: String(formData.get("scheduledStartAt") ?? ""),
    scheduledEndAt: String(formData.get("scheduledEndAt") ?? ""),
    actualStartAt: String(formData.get("actualStartAt") ?? ""),
    actualEndAt: String(formData.get("actualEndAt") ?? ""),
    distanceKm: String(formData.get("distanceKm") ?? ""),
    fareAmount: String(formData.get("fareAmount") ?? ""),
    status: (formData.get("status") as TripFormValues["status"]) ?? "SCHEDULED",
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

export async function createTripAction(
  _prev: TripActionState,
  formData: FormData,
): Promise<TripActionState> {
  const { supabase, user } = await requireUser();
  const repo = createTripRepo(supabase);
  const values = toTripFormValues(formData);

  const result = await createTrip(repo, user.id, values);

  if (result.fieldErrors) {
    return { fieldErrors: result.fieldErrors };
  }

  if (result.error) {
    return { error: result.error };
  }

  if (result.tripId) {
    redirect(`/trips/${result.tripId}`);
  }

  return {};
}

export async function updateTripAction(
  _prev: TripActionState,
  formData: FormData,
): Promise<TripActionState> {
  const { supabase, user } = await requireUser();
  const repo = createTripRepo(supabase);
  const tripId = String(formData.get("tripId") ?? "");

  if (!tripId) {
    return { error: "Trip ID is missing." };
  }

  const values = toTripFormValues(formData);
  const result = await updateTrip(repo, user.id, tripId, values);

  if (result.fieldErrors) {
    return { fieldErrors: result.fieldErrors };
  }

  if (result.error) {
    return { error: result.error };
  }

  if (result.tripId) {
    redirect(`/trips/${result.tripId}`);
  }

  return {};
}

export async function deleteTripAction(
  _prev: TripActionState,
  formData: FormData,
): Promise<TripActionState> {
  const { supabase, user } = await requireUser();
  const repo = createTripRepo(supabase);
  const tripId = String(formData.get("tripId") ?? "");
  const confirmCode = String(formData.get("confirmCode") ?? "").trim();

  if (!tripId) {
    return { error: "Trip ID is missing." };
  }

  if (!confirmCode) {
    return { error: "Please type the trip code to confirm deletion." };
  }

  const existing = await repo.findTripById(tripId);
  if (!existing) {
    return { error: "Trip not found." };
  }

  if (existing.trip_code !== confirmCode) {
    return { error: "Trip code confirmation does not match." };
  }

  const result = await deleteTrip(repo, user.id, tripId);

  if (result.error) {
    return { error: result.error };
  }

  redirect("/trips");
}

export async function startTripAction(formData: FormData): Promise<TripActionState> {
  const { supabase, user } = await requireUser();
  const repo = createTripRepo(supabase);
  const tripId = String(formData.get("tripId") ?? "");

  if (!tripId) {
    return { error: "Trip ID is missing." };
  }

  const result = await startTrip(repo, user.id, tripId);

  if (result.error) {
    return { error: result.error };
  }

  redirect(`/trips/${tripId}`);
}

export async function completeTripAction(formData: FormData): Promise<TripActionState> {
  const { supabase, user } = await requireUser();
  const repo = createTripRepo(supabase);
  const tripId = String(formData.get("tripId") ?? "");

  if (!tripId) {
    return { error: "Trip ID is missing." };
  }

  const result = await completeTrip(repo, user.id, tripId);

  if (result.error) {
    return { error: result.error };
  }

  redirect(`/trips/${tripId}`);
}

export async function cancelTripAction(formData: FormData): Promise<TripActionState> {
  const { supabase, user } = await requireUser();
  const repo = createTripRepo(supabase);
  const tripId = String(formData.get("tripId") ?? "");

  if (!tripId) {
    return { error: "Trip ID is missing." };
  }

  const result = await cancelTrip(repo, user.id, tripId);

  if (result.error) {
    return { error: result.error };
  }

  redirect(`/trips/${tripId}`);
}
