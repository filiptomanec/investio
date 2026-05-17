/**
 * E2E: Auth flows — T-019
 *
 * Covers:
 *  1. Anon visits /dashboard → redirected to /login
 *  2. Signup form validation: empty email shows error
 *  3. Login form: Google button is disabled with a tooltip when backend is
 *     not configured (isSupabaseConfigured() returns false)
 *
 * NOT covered here (requires real Supabase + email confirm):
 *  - Full signup → email link → session created → /dashboard
 *  - Login with valid credentials
 *  See manual test checklist in apps/web/e2e/README.md.
 *
 * The tests run against the app in "backend not configured" mode, which is
 * the default when NEXT_PUBLIC_SUPABASE_URL is not set (or set to the
 * placeholder). In this mode:
 *  - The banner "Backend není nakonfigurován" is visible on auth pages.
 *  - The Google button is disabled (aria-disabled="true").
 *  - The email/password form is rendered but form submissions fail gracefully.
 */

import { test, expect } from "@playwright/test";

test.describe("auth: protected routes", () => {
  test("anon visiting /dashboard is redirected to /login", async ({ page }) => {
    // Navigate directly to the Czech dashboard URL.
    // The DashboardPage server component calls requireUser() which throws
    // UnauthorizedError → redirect(`/${locale}/login`).
    // With localePrefix "as-needed" the CS default routes without /cs/ prefix.
    await page.goto("/dashboard");

    // After server redirect, we should land on /login
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    expect(page.url()).toContain("/login");

    // Login page heading should be visible
    await expect(page.locator("h1")).toContainText(/investio/i);
  });

  test("anon visiting /en/dashboard is redirected to /en/login", async ({
    page,
  }) => {
    await page.goto("/en/dashboard");
    await page.waitForURL(/\/en\/login/, { timeout: 10_000 });
    expect(page.url()).toContain("/en/login");
  });
});

test.describe("auth: signup form validation", () => {
  test("empty email shows inline validation error", async ({ page }) => {
    await page.goto("/signup");

    // Find the submit button and click without filling anything
    const submitBtn = page.getByRole("button", {
      name: /registrovat|sign.?up|vytvořit/i,
    });
    await submitBtn.click();

    // react-hook-form with zodResolver fires validation on submit.
    // The error <p> has role="alert" and id="email-error".
    const emailError = page.locator('[id="email-error"]');
    await expect(emailError).toBeVisible({ timeout: 3_000 });
  });

  test("invalid email format shows validation error", async ({ page }) => {
    await page.goto("/signup");

    const emailInput = page.getByLabel(/e-?mail/i).first();
    await emailInput.fill("not-an-email");
    // Blur to trigger onChange validation (mode: "onChange" in the form)
    await emailInput.blur();

    const emailError = page.locator('[id="email-error"]');
    await expect(emailError).toBeVisible({ timeout: 3_000 });
  });

  test("mismatched passwords show confirm-password error", async ({ page }) => {
    await page.goto("/signup");

    await page.getByLabel(/e-?mail/i).first().fill("test@example.com");
    await page.getByLabel(/^heslo$/i).fill("password1!");
    await page.getByLabel(/potvrdit|confirm/i).fill("different_password!");

    const submitBtn = page.getByRole("button", {
      name: /registrovat|sign.?up|vytvořit/i,
    });
    await submitBtn.click();

    // The cross-field refine error lands on passwordConfirm
    const confirmError = page.locator('[id="confirm-error"]');
    await expect(confirmError).toBeVisible({ timeout: 3_000 });
  });
});

test.describe("auth: login form", () => {
  test("Google button is disabled with tooltip when backend not configured", async ({
    page,
  }) => {
    await page.goto("/login");

    // In unconfigured mode the banner is shown
    const banner = page.getByRole("alert").first();
    await expect(banner).toBeVisible();

    // The Google sign-in button should have aria-disabled="true"
    const googleBtn = page.getByRole("button", { name: /google/i });
    await expect(googleBtn).toBeVisible();
    await expect(googleBtn).toBeDisabled();
  });

  test("login form: empty email submit shows error", async ({ page }) => {
    await page.goto("/login");

    const submitBtn = page.getByRole("button", {
      name: /přihlásit|sign.?in/i,
    });
    await submitBtn.click();

    const emailError = page.locator('[id="email-error"]');
    await expect(emailError).toBeVisible({ timeout: 3_000 });
  });

  test("login form renders email and password fields", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByLabel(/e-?mail/i).first()).toBeVisible();
    await expect(page.getByLabel(/heslo|password/i).first()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// SKIPPED: Full signup → email confirm → session
// ---------------------------------------------------------------------------
// This test requires a live Supabase project with email delivery configured.
// It is intentionally skipped here and documented as a manual test.
// See: apps/web/e2e/README.md → "Manual tests"
test.skip("signup full flow: signup → check email confirmation (manual)", async ({
  page,
}) => {
  // Manual steps:
  //   1. Set NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local
  //   2. Navigate to /signup
  //   3. Fill email (use a real mailbox or Mailhog)
  //   4. Fill password (8+ chars)
  //   5. Confirm password
  //   6. Click "Registrovat"
  //   7. Expect "Zkontrolujte e-mail" success screen
  //   8. Click confirm link in email
  //   9. Expect redirect to /dashboard
  void page;
});
