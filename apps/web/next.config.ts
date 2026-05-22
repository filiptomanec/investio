import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

// ---------------------------------------------------------------------------
// Security HTTP headers (T-025 / SR-002)
// ---------------------------------------------------------------------------

/**
 * Build the Content-Security-Policy value.
 *
 * Next.js App Router requires:
 *  - `'unsafe-inline'` for styles (SSG/RSC inline styles).
 *  - `'unsafe-eval'` for scripts (Next.js dev hot-reload + some RSC hydration).
 *
 * CSP_REPORT_ONLY env var:
 *  - Unset / "true"  → report-only mode (default — won't break the app).
 *  - "false"         → enforce mode (set after monitoring period).
 */
function buildCsp(): string {
  const supabaseUrl = process.env["NEXT_PUBLIC_SUPABASE_URL"] ?? "";
  // Derive the WebSocket URL for Supabase Realtime (wss:// from https://)
  const supabaseWs = supabaseUrl.replace(/^https?:\/\//, "wss://");

  const directives = [
    "default-src 'self'",
    // Scripts: Next.js client bundle + eval needed for webpack runtime
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    // Styles: inline styles used by Next.js SSG / RSC
    "style-src 'self' 'unsafe-inline'",
    // Images: self + data URIs (e.g. base64 avatars)
    "img-src 'self' data: blob:",
    // Fonts: self
    "font-src 'self'",
    // Connections: API calls to Supabase REST + Realtime websocket + Sentry
    [
      "connect-src",
      "'self'",
      supabaseUrl,
      supabaseWs,
      "https://*.sentry.io",
      "https://sentry.io",
    ].join(" "),
    // Frames: disallow embedding
    "frame-ancestors 'none'",
    // Forms: only submit to self
    "form-action 'self'",
    // Base URI: restrict to self to prevent base-tag injection
    "base-uri 'self'",
    // Object/embed: disallow plugins
    "object-src 'none'",
  ];

  return directives.join("; ");
}

const CSP_REPORT_ONLY = process.env["CSP_REPORT_ONLY"] !== "false";
const CSP_HEADER_KEY = CSP_REPORT_ONLY
  ? "Content-Security-Policy-Report-Only"
  : "Content-Security-Policy";

const securityHeaders = [
  // Enforce HTTPS for 2 years, include subdomains, eligible for preload list
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Prevent the page from being embedded in iframes (clickjacking defence)
  { key: "X-Frame-Options", value: "DENY" },
  // Prevent MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Send origin only on same-origin, full URL on cross-origin (no path leakage)
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Restrict access to sensitive browser APIs
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  // CSP — report-only by default; switch to enforce via CSP_REPORT_ONLY=false
  { key: CSP_HEADER_KEY, value: buildCsp() },
];

const nextConfig: NextConfig = {
  transpilePackages: [
    "@investio/shared",
    "@investio/i18n",
    "@investio/db",
    "@investio/auth",
    "@investio/design-tokens",
  ],
  experimental: {
    // Optimise imports for large icon/chart libraries so unused exports are
    // tree-shaken at build time rather than shipped as unused JS.
    optimizePackageImports: ["lucide-react", "recharts"],
  },
  async headers() {
    return [
      {
        // Apply to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
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
