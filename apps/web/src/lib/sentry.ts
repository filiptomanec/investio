import * as Sentry from "@sentry/react";

// Side-effect module: imported once from src/routes/__root.tsx so initialization
// happens before the React tree mounts. When VITE_SENTRY_DSN is empty (local
// dev with no .env, or CI) Sentry is a no-op — init is skipped entirely.

const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;

if (dsn) {
  Sentry.init({
    dsn,
    environment:
      (import.meta.env.VITE_SENTRY_ENVIRONMENT as string | undefined) ??
      import.meta.env.MODE,
    // Conservative defaults — bump tracesSampleRate to >0 if you want spans.
    tracesSampleRate: 0,
    // Capture console.error in production so we see UI crashes even when
    // ErrorBoundary doesn't fire.
    integrations: [],
  });
}

export { Sentry };
