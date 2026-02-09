import "server-only";

import { createClient } from "@supabase/supabase-js";

import { env, requireEnv } from "@/lib/env";

export function createSupabaseAdminClient() {
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL", env.SUPABASE_URL),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY", env.SUPABASE_SERVICE_ROLE_KEY),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
