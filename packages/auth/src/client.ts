// @investio/auth — browser client factory
// Uses @supabase/ssr createBrowserClient with cookie-based persistent session.
// NOT a singleton — call once per component tree (or store in a module-level ref).

import {
  createBrowserClient as supabaseCreateBrowserClient,
} from "@supabase/ssr";

/**
 * Creates a Supabase browser client suitable for Client Components.
 * Reads NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY from
 * the environment at call time. If either is missing or looks like a
 * placeholder, the client is still returned — callers should check
 * isSupabaseConfigured() before triggering auth flows.
 */
export function createBrowserClient() {
  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"] ?? "";
  const anonKey = process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"] ?? "";

  return supabaseCreateBrowserClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

/**
 * Returns true when both required env vars are present and do not look
 * like placeholder values (e.g. "your-project-url").
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"] ?? "";
  const key = process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"] ?? "";
  return (
    url.startsWith("https://") &&
    url.includes(".supabase.co") &&
    key.length > 20
  );
}
