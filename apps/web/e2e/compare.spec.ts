/**
 * E2E: Comparison view — T-019
 *
 * Covers:
 *  - Default scenarios load without URL params (two columns visible)
 *  - Share button copies a URL to clipboard (Playwright clipboard interception)
 *
 * The compare page reads searchParams via useSearchParams() inside a Suspense
 * boundary. When no ?a=&b= params are provided, it falls back to
 * defaultScenarioA (compound) and defaultScenarioB (real_estate).
 *
 * No Supabase required — comparison is fully client-side.
 */

import { test, expect } from "@playwright/test";

const COMPARE_URL = "/compare";

test.describe("comparison: default scenarios", () => {
  test("default scenarios load — both columns visible", async ({ page }) => {
    await page.goto(COMPARE_URL);

    // The page initially renders a loading skeleton (pulse animation),
    // then resolves to the actual comparison. Wait for the chart heading.
    await expect(
      page.getByRole("heading", { level: 1 })
    ).toBeVisible({ timeout: 10_000 });

    // Two scenario cards should be visible.
    // Each card has a CardTitle with the scenario label text.
    // Translations: comparison.scenarioA = "Scénář A", comparison.scenarioB = "Scénář B"
    // We use a regex to be robust against minor translation changes.
    await expect(page.getByText(/scénář\s*a/i).first()).toBeVisible();
    await expect(page.getByText(/scénář\s*b/i).first()).toBeVisible();
  });

  test("default comparison chart renders with two data lines", async ({
    page,
  }) => {
    await page.goto(COMPARE_URL);

    // Wait until heading resolves (Suspense)
    await page.getByRole("heading", { level: 1 }).waitFor({ state: "visible" });

    // Recharts LineChart renders two <path> elements for the two lines
    const svg = page.locator("svg").first();
    await expect(svg).toBeVisible({ timeout: 10_000 });

    const paths = page.locator("svg path");
    const count = await paths.count();
    expect(count).toBeGreaterThan(1);
  });

  test("winner diff panel is visible", async ({ page }) => {
    await page.goto(COMPARE_URL);

    await page.getByRole("heading", { level: 1 }).waitFor({ state: "visible" });

    // DiffPanel renders a table with comparison data
    const table = page.locator("table").first();
    await expect(table).toBeVisible();
  });
});

test.describe("comparison: share button", () => {
  test("share button copies URL to clipboard", async ({ page, context }) => {
    // Grant clipboard permissions so we can read back what was written
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    await page.goto(COMPARE_URL);

    // Wait for page to fully resolve
    await page.getByRole("heading", { level: 1 }).waitFor({ state: "visible" });

    // Find the share button by its icon label or text
    // The button text is t("comparison.share") — in CS: "Sdílet" / "Kopírovat odkaz"
    // We use a broad match for resilience
    const shareBtn = page
      .getByRole("button", { name: /sdílet|share|kopírovat/i })
      .first();
    await expect(shareBtn).toBeVisible();

    await shareBtn.click();

    // After click the button text should change to "Zkopírováno" / "Copied"
    // (the ShareButton component sets copied=true for 2.5s)
    await expect(
      page.getByRole("button", { name: /zkopírováno|copied/i }).first()
    ).toBeVisible({ timeout: 3_000 });

    // Also verify the clipboard actually contains a URL with ?a= and ?b= params
    const clipboardText = await page.evaluate(() =>
      navigator.clipboard.readText()
    );
    expect(clipboardText).toContain("?a=");
    expect(clipboardText).toContain("&b=");
    expect(clipboardText).toMatch(/^https?:\/\//);
  });
});
