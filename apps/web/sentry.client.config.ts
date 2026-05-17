import * as Sentry from "@sentry/nextjs";

// Browser/client config — opt-in via NEXT_PUBLIC_SENTRY_DSN.
// Using NEXT_PUBLIC_ prefix so the value is inlined at build time for the
// browser bundle. If unset the SDK is disabled and no console errors appear.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN ?? undefined,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? "development",
  tracesSampleRate: 0.1,
  sendDefaultPii: false,
  // Replay is disabled by default — enable when you have real traffic and want
  // session recordings. Costs add up quickly on free Sentry tier.
  // replaysSessionSampleRate: 0,
  // replaysOnErrorSampleRate: 0,
});
