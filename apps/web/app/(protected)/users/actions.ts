"use server";

import { redirect } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createUserRepo } from "@/lib/users/repo";
import { UserFormValues } from "@/lib/users/types";
import { createUser, deleteUser, updateUser } from "@/lib/users/service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type UserActionState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof UserFormValues, string>>;
};

function toUserFormValues(formData: FormData): UserFormValues {
  return {
    fullName: String(formData.get("fullName") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    branchId: String(formData.get("branchId") ?? ""),
    designation: String(formData.get("designation") ?? ""),
    status: (formData.get("status") as UserFormValues["status"]) ?? "ACTIVE",
    password: String(formData.get("password") ?? ""),
    resetPassword: formData.get("resetPassword") === "on",
    isSuperAdmin: formData.get("isSuperAdmin") === "on",
    permissions: JSON.parse(String(formData.get("permissions") ?? "[]")),
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

export async function createUserAction(
  _prev: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  const { supabase, user } = await requireUser();
  const admin = createSupabaseAdminClient();
  const repo = createUserRepo(supabase, {
    async createUser(params) {
      const { data, error } = await admin.auth.admin.createUser({
        email: params.email,
        password: params.password,
        email_confirm: true,
      });
      if (error || !data.user) {
        throw error ?? new Error("Failed to create auth user.");
      }
      return { id: data.user.id };
    },
    async updateUser(userId, params) {
      const { error } = await admin.auth.admin.updateUserById(userId, {
        email: params.email,
        password: params.password,
        ban_duration: params.banDuration ?? undefined,
      });
      if (error) {
        throw error;
      }
    },
  });

  const values = toUserFormValues(formData);
  const result = await createUser(repo, user.id, values);

  if (result.fieldErrors) {
    return { fieldErrors: result.fieldErrors };
  }

  if (result.error) {
    return { error: result.error };
  }

  if (result.userId) {
    redirect(`/users/${result.userId}`);
  }

  return {};
}

export async function updateUserAction(
  _prev: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  const { supabase, user } = await requireUser();
  const admin = createSupabaseAdminClient();
  const repo = createUserRepo(supabase, {
    async createUser() {
      throw new Error("Create user not supported here.");
    },
    async updateUser(userId, params) {
      const { error } = await admin.auth.admin.updateUserById(userId, {
        email: params.email,
        password: params.password,
        ban_duration: params.banDuration ?? undefined,
      });
      if (error) {
        throw error;
      }
    },
  });

  const userId = String(formData.get("userId") ?? "");
  if (!userId) {
    return { error: "User ID is missing." };
  }

  const values = toUserFormValues(formData);
  const result = await updateUser(repo, user.id, userId, values);

  if (result.fieldErrors) {
    return { fieldErrors: result.fieldErrors };
  }

  if (result.error) {
    return { error: result.error };
  }

  if (result.userId) {
    redirect(`/users/${result.userId}`);
  }

  return {};
}

export async function deleteUserAction(
  _prev: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  const { supabase, user } = await requireUser();
  const admin = createSupabaseAdminClient();
  const repo = createUserRepo(supabase, {
    async createUser() {
      throw new Error("Create user not supported here.");
    },
    async updateUser(userId, params) {
      const { error } = await admin.auth.admin.updateUserById(userId, {
        ban_duration: params.banDuration ?? undefined,
      });
      if (error) {
        throw error;
      }
    },
  });

  const userId = String(formData.get("userId") ?? "");
  const confirmName = String(formData.get("confirmName") ?? "").trim();
  if (!userId) {
    return { error: "User ID is missing." };
  }

  if (!confirmName) {
    return { error: "Please type the user name to confirm deletion." };
  }

  const existing = await repo.getUserProfile(userId);
  if (!existing) {
    return { error: "User not found." };
  }

  if (existing.full_name !== confirmName) {
    return { error: "User name confirmation does not match." };
  }

  const result = await deleteUser(repo, user.id, userId);

  if (result.error) {
    return { error: result.error };
  }

  redirect("/users");
}
