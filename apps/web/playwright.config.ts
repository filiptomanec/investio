import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for @investio/web E2E suite.
 *
 * Runs against a local Next.js dev server (port 3000).
 * Set E2E_BASE_URL to run against a Vercel preview or staging URL.
 *
 * CI note: CI wire-up lives in T-022 (DevOps). This config is ready for it:
 *   - retries: 2 in CI, 0 locally
 *   - workers: 1 in CI to avoid port conflicts
 */

const baseURL = process.env["E2E_BASE_URL"] ?? "http://localhost:3000";
const isCI = !!process.env["CI"];

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,

  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  /**
   * Spin up the dev server automatically when no existing server is reachable.
   * reuseExistingServer lets local dev with `pnpm dev` already running skip the
   * startup cost — Playwright will connect to the existing process.
   */
  webServer: {
    command: "pnpm dev",
    url: baseURL,
    reuseExistingServer: !isCI,
    timeout: 120_000,
    env: {
      // Pass through Supabase env vars if set — required for auth tests that
      // actually call the backend. Most tests target unconfigured state.
      NEXT_PUBLIC_SUPABASE_URL: process.env["NEXT_PUBLIC_SUPABASE_URL"] ?? "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY:
        process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"] ?? "",
    },
  },
});
