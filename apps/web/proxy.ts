import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export function proxy(request: NextRequest) {
  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except for:
  // - API routes (/api/...)
  // - Next.js internals (/_next/...)
  // - Static files with extensions (.ico, .png, etc.)
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
