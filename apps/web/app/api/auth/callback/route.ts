// POST /api/auth/callback — Supabase OAuth callback handler
// Exchanges the OAuth authorization code for a session and sets httpOnly cookies.
// Redirects to the dashboard on success, or to /login on error.
//
// Per @supabase/ssr docs: https://supabase.com/docs/guides/auth/server-side/nextjs

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";

export const runtime = "nodejs";

type CookieToSet = { name: string; value: string; options: CookieOptions };

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Extract locale from the Referer or default to "cs"
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    // No code — redirect to login with error
    return NextResponse.redirect(`${origin}/cs/login?error=no_code`);
  }

  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"] ?? "";
  const anonKey = process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"] ?? "";

  if (!url || !anonKey) {
    return NextResponse.redirect(`${origin}/cs/login?error=backend_not_configured`);
  }

  const response = NextResponse.redirect(`${origin}${next}`);

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] exchangeCodeForSession error:", error.message);
    return NextResponse.redirect(`${origin}/cs/login?error=auth_callback_failed`);
  }

  // Determine redirect locale: prefer the `next` param, fallback to /cs/dashboard
  const redirectTo = next.startsWith("/") ? `${origin}${next}` : `${origin}/cs/dashboard`;
  return NextResponse.redirect(redirectTo);
}
