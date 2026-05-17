// Use this endpoint to verify that Sentry capture works after you have set
// SENTRY_DSN and NEXT_PUBLIC_SENTRY_DSN in your environment.
//
// Usage:
//   curl https://<your-domain>/api/sentry-test
//
// Expected: HTTP 500 + Sentry event visible in your Sentry project dashboard.
//
// This endpoint is intentionally blocked in production to prevent noise.
// Delete this file after you have verified Sentry is wired correctly.

import { NextResponse } from "next/server";

export const runtime = "nodejs";

export function GET(): NextResponse {
  const env = process.env.VERCEL_ENV ?? process.env.NODE_ENV;

  if (env === "production") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 404 },
    );
  }

  // Intentional error — Sentry should capture this as an unhandled exception
  // in the Route Handler. Check your Sentry dashboard after hitting this URL.
  throw new Error(
    `Sentry test error — thrown at ${new Date().toISOString()}`,
  );
}
