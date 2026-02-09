import { createBrowserClient } from "@supabase/ssr";

import { env, requireEnv } from "@/lib/env";

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL", env.SUPABASE_URL),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", env.SUPABASE_ANON_KEY),
  );
}
