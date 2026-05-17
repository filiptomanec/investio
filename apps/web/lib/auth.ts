// Auth helper for Route Handlers.
// Creates a Supabase server client via @supabase/ssr (httpOnly cookie strategy)
// and returns the authenticated user or throws UnauthorizedError.
//
// Authorization header fallback (Bearer <token>) is supported for
// integration tests that cannot set httpOnly cookies programmatically.

import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies, headers } from "next/headers";
import { UnauthorizedError } from "./errors";

// ---------------------------------------------------------------------------
// Environment config
// ---------------------------------------------------------------------------

function getSupabaseConfig() {
  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const anonKey = process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];
  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY env vars",
    );
  }
  return { url, anonKey };
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CookieToSet = { name: string; value: string; options: CookieOptions };

// ---------------------------------------------------------------------------
// requireUser
// ---------------------------------------------------------------------------

export interface AuthContext {
  userId: string;
  supabase: ReturnType<typeof createServerClient>;
}

/**
 * Reads the Supabase session from httpOnly cookies (production path) or
 * from the Authorization: Bearer <token> header (integration test fallback).
 *
 * Returns { userId, supabase } for use in Route Handlers.
 * Throws UnauthorizedError if no valid session is found.
 */
export async function requireUser(): Promise<AuthContext> {
  const { url, anonKey } = getSupabaseConfig();

  // --- Authorization header fallback (for integration tests) ---
  const headerStore = await headers();
  const authorization = headerStore.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    const token = authorization.slice("Bearer ".length).trim();
    // Use a plain client to validate the JWT via getUser (not getSession —
    // getUser re-validates the token server-side, not just locally).
    const anonClient = createClient(url, anonKey, {
      auth: { persistSession: false },
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    });
    const {
      data: { user },
      error,
    } = await anonClient.auth.getUser(token);
    if (!error && user) {
      const cookieStore = await cookies();
      const supabase = createServerClient(url, anonKey, {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: CookieToSet[]) {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          },
        },
      });
      return { userId: user.id, supabase };
    }
  }

  // --- Cookie-based auth (production path via @supabase/ssr) ---
  const cookieStore = await cookies();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new UnauthorizedError();
  }

  return { userId: user.id, supabase };
}
