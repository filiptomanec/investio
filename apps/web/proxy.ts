import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

// ---------------------------------------------------------------------------
// Protected route patterns
// Routes that start with /<locale>/dashboard require an authenticated session.
// Public routes (calc, compare, login, signup, templates) are not protected.
// ---------------------------------------------------------------------------

const DASHBOARD_PATTERN = /^\/(?:cs|en)\/dashboard(\/|$)/;

type CookieToSet = { name: string; value: string; options: CookieOptions };

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Auth check for dashboard routes
  if (DASHBOARD_PATTERN.test(pathname)) {
    const url = process.env["NEXT_PUBLIC_SUPABASE_URL"] ?? "";
    const anonKey = process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"] ?? "";

    // If Supabase is not configured, skip auth check gracefully —
    // the dashboard page itself will show an instructional banner.
    if (!url || !anonKey || !url.startsWith("https://")) {
      return intlMiddleware(request);
    }

    // Build a response placeholder to allow cookie mutations
    const response = NextResponse.next({
      request: { headers: request.headers },
    });

    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          for (const { name, value, options } of cookiesToSet) {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          }
        },
      },
    });

    // Use getUser() — re-validates the JWT server-side (not just locally).
    // This is synchronous-ish: we need to return a Promise-aware middleware.
    return supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        // Extract the locale from the pathname for the redirect
        const localeMatch = pathname.match(/^\/(cs|en)\//);
        const locale = localeMatch ? localeMatch[1] : "cs";
        const loginUrl = new URL(`/${locale}/login`, request.url);
        return NextResponse.redirect(loginUrl, { status: 307 });
      }
      // Authenticated — continue through intl middleware (handles locale prefix)
      return intlMiddleware(request);
    });
  }

  // All other routes — just run intl middleware
  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except for:
  // - API routes (/api/...)
  // - Next.js internals (/_next/...)
  // - Static files with extensions (.ico, .png, etc.)
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
