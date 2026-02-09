"use server";

import { redirect } from "next/navigation";

import { getPostLoginRedirect } from "@/lib/auth/redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type LoginState = {
  error?: string;
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function loginAction(_: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !isValidEmail(email)) {
    return { error: "Please enter a valid email address." };
  }

  if (!password || password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return { error: "Invalid email or password." };
  }

  await supabase
    .from("user_profiles")
    .update({ last_login_at: new Date().toISOString() })
    .eq("user_id", data.user.id);

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("is_super_admin, designation")
    .eq("user_id", data.user.id)
    .maybeSingle();

  redirect(
    getPostLoginRedirect({
      isSuperAdmin: profile?.is_super_admin,
      designation: profile?.designation,
    }),
  );
}
