"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type SetupState = {
  error?: string;
  success?: boolean;
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function bootstrapAction(_: SetupState, formData: FormData): Promise<SetupState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const designation = String(formData.get("designation") ?? "").trim();

  if (!fullName) {
    return { error: "Full name is required." };
  }

  if (!email || !isValidEmail(email)) {
    return { error: "A valid email address is required." };
  }

  if (!password || password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const admin = createSupabaseAdminClient();

  const { data: existing, error: existingError } = await admin
    .from("user_profiles")
    .select("user_id")
    .eq("is_super_admin", true)
    .is("deleted_at", null)
    .limit(1);

  if (existingError) {
    return { error: existingError.message };
  }

  if (existing && existing.length > 0) {
    return { error: "Setup already completed. Super admin exists." };
  }

  const { data: userData, error: userError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (userError || !userData.user) {
    return { error: userError?.message ?? "Failed to create auth user." };
  }

  const { error: bootstrapError } = await admin.rpc("bootstrap_super_admin", {
    p_user_id: userData.user.id,
    p_full_name: fullName,
    p_email: email,
    p_designation: designation || null,
    p_branch_id: null,
  });

  if (bootstrapError) {
    await admin.auth.admin.deleteUser(userData.user.id).catch(() => undefined);
    return { error: bootstrapError.message };
  }

  return { success: true };
}
