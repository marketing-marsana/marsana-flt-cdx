import { type CookieOptions } from "@supabase/ssr";
import { env } from "@/lib/env";

export function getCookieOptions(options: CookieOptions): CookieOptions {
  const isProduction = process.env.NODE_ENV === "production";
  const appUrl = env.APP_URL;

  let domain = undefined;
  if (isProduction && appUrl) {
    try {
      const url = new URL(appUrl);
      const hostname = url.hostname;

      // Only set domain if it's not localhost and not an IP address
      if (hostname !== "localhost" && !/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
        domain = hostname;
      }
    } catch {
      console.error("Invalid APP_URL for cookie domain:", appUrl);
    }
  }

  return {
    ...options,
    // SameSite=Lax is generally recommended for SSR auth
    sameSite: options.sameSite || "lax",
    // Always use Secure in production
    secure: isProduction || options.secure,
    // Ensure HttpOnly is true by default unless explicitly disabled
    httpOnly: options.httpOnly !== false,
    // Ensure Path is set to / by default
    path: options.path || "/",
    // Set domain for cross-subdomain/cross-request persistence in production
    ...(domain && { domain }),
  };
}
