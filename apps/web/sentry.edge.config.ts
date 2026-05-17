import * as Sentry from "@sentry/nextjs";

// Edge runtime config — same opt-in pattern as server config.
// Runs in Vercel Edge Functions / Next.js middleware.
Sentry.init({
  dsn: process.env.SENTRY_DSN ?? undefined,
  enabled: !!process.env.SENTRY_DSN,
  environment: process.env.VERCEL_ENV ?? "development",
  tracesSampleRate: 0.1,
  sendDefaultPii: false,
});
