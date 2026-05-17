import * as Sentry from "@sentry/nextjs";

// Sentry is opt-in: if SENTRY_DSN is not set, the SDK is disabled and
// no errors are thrown in development. Set the env var to enable.
Sentry.init({
  dsn: process.env.SENTRY_DSN ?? undefined,
  enabled: !!process.env.SENTRY_DSN,
  environment: process.env.VERCEL_ENV ?? "development",
  tracesSampleRate: 0.1,
  // Do not send PII (user IP, email, etc.)
  sendDefaultPii: false,
});
