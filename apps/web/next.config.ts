import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  transpilePackages: [
    "@investio/shared",
    "@investio/i18n",
    "@investio/db",
    "@investio/auth",
    "@investio/design-tokens",
  ],
};

const withIntl = withNextIntl(nextConfig);

// Sentry wraps the outermost config. Source maps upload only runs when
// SENTRY_AUTH_TOKEN is present — skipped silently in local dev and PRs
// that haven't configured the secret.
export default withSentryConfig(withIntl, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Upload source maps to Sentry only when the auth token is available.
  // Without the token the build still succeeds; Sentry just won't have
  // readable stack traces until you configure SENTRY_AUTH_TOKEN in Vercel.
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.SENTRY_AUTH_TOKEN, // suppress CLI output when not uploading

  // Disable source map upload when there is no auth token.
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },

  // Tree-shake Sentry debug code from production bundles.
  disableLogger: true,

  // Avoid automatically wrapping all Route Handlers and Server Actions;
  // we handle instrumentation explicitly via instrumentation.ts.
  autoInstrumentServerFunctions: false,
  autoInstrumentMiddleware: false,
});
