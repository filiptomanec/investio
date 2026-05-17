// @investio/auth — server client factory (Next.js SSR / Route Handlers)
// Uses @supabase/ssr createServerClient with a cookie reader/writer adapter.
// Call once per request — do NOT cache across requests.

import {
  createServerClient as supabaseCreateServerClient,
  type CookieOptions,
} from "@supabase/ssr";

type CookieStore = {
  getAll(): Array<{ name: string; value: string }>;
  set(name: string, value: string, options: CookieOptions): void;
};

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Creates a Supabase server client for use in:
 *  - Next.js Server Components
 *  - Route Handlers
 *  - Middleware (pass a compatible cookie store)
 *
 * The `cookies` argument must implement getAll() and set() from next/headers
 * ReadonlyRequestCookies / RequestCookies, or a compatible adapter.
 */
export function createServerClient(cookies: CookieStore) {
  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"] ?? "";
  const anonKey = process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"] ?? "";

  return supabaseCreateServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        for (const { name, value, options } of cookiesToSet) {
          try {
            cookies.set(name, value, options);
          } catch {
            // set() throws in Server Components (read-only cookie store).
            // The session refresh is handled by middleware — safe to ignore here.
          }
        }
      },
    },
  });
}
