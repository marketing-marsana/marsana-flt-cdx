import "server-only";

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

import { env, requireEnv } from "@/lib/env";
import { getCookieOptions } from "./cookies";

export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL", env.SUPABASE_URL),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", env.SUPABASE_ANON_KEY),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              const cookieOptions = getCookieOptions(options);
              cookieStore.set(name, value, cookieOptions);
            });
          } catch {
            // cookies() can be read-only in Server Components.
          }
        },
      },
    },
  );
}
