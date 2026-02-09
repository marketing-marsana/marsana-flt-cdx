"use server";

import { redirect } from "next/navigation";

import { createBranchRepo } from "@/lib/branches/repo";
import { BranchFormValues } from "@/lib/branches/types";
import { createBranch, deleteBranch, updateBranch } from "@/lib/branches/service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type BranchActionState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof BranchFormValues, string>>;
};

function toBranchFormValues(formData: FormData): BranchFormValues {
  return {
    name: String(formData.get("name") ?? ""),
    code: String(formData.get("code") ?? ""),
    type: formData.get("type") as BranchFormValues["type"],
    address: String(formData.get("address") ?? ""),
    contactNumber: String(formData.get("contactNumber") ?? ""),
    status: formData.get("status") as BranchFormValues["status"],
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

export async function createBranchAction(
  _prev: BranchActionState,
  formData: FormData,
): Promise<BranchActionState> {
  const { supabase, user } = await requireUser();
  const repo = createBranchRepo(supabase);
  const values = toBranchFormValues(formData);

  const result = await createBranch(repo, user.id, values);

  if (result.fieldErrors) {
    return { fieldErrors: result.fieldErrors };
  }

  if (result.error) {
    return { error: result.error };
  }

  if (result.branchId) {
    redirect(`/branches/${result.branchId}`);
  }

  return {};
}

export async function updateBranchAction(
  _prev: BranchActionState,
  formData: FormData,
): Promise<BranchActionState> {
  const { supabase, user } = await requireUser();
  const repo = createBranchRepo(supabase);
  const branchId = String(formData.get("branchId") ?? "");

  if (!branchId) {
    return { error: "Branch ID is missing." };
  }

  const values = toBranchFormValues(formData);
  const result = await updateBranch(repo, user.id, branchId, values);

  if (result.fieldErrors) {
    return { fieldErrors: result.fieldErrors };
  }

  if (result.error) {
    return { error: result.error };
  }

  if (result.branchId) {
    redirect(`/branches/${result.branchId}`);
  }

  return {};
}

export async function deleteBranchAction(
  _prev: BranchActionState,
  formData: FormData,
): Promise<BranchActionState> {
  const { supabase, user } = await requireUser();
  const repo = createBranchRepo(supabase);
  const branchId = String(formData.get("branchId") ?? "");
  const confirmName = String(formData.get("confirmName") ?? "").trim();

  if (!branchId) {
    return { error: "Branch ID is missing." };
  }

  if (!confirmName) {
    return { error: "Please type the branch name to confirm deletion." };
  }

  const existing = await repo.findBranchById(branchId);
  if (!existing) {
    return { error: "Branch not found." };
  }

  if (existing.name !== confirmName) {
    return { error: "Branch name confirmation does not match." };
  }

  const result = await deleteBranch(repo, user.id, branchId);

  if (result.error) {
    return { error: result.error };
  }

  redirect("/branches");
}
