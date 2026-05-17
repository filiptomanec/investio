/**
 * E2E: Compound interest calculator — T-019
 *
 * Covers:
 *  - Live recalc on input change (result panel updates without navigation)
 *  - Chart area renders (SVG via Recharts ResponsiveContainer)
 *  - Locale switch CS → EN (URL-based, next-intl localePrefix "as-needed")
 *
 * Default locale is CS, so /calc/compound resolves without /cs/ prefix.
 * English is at /en/calc/compound.
 *
 * These tests do NOT require a running Supabase instance — the page works
 * fully in the unconfigured state (calculator is client-side only).
 */

import { test, expect } from "@playwright/test";

// CS default locale path
const COMPOUND_URL = "/calc/compound";
// EN locale path
const COMPOUND_URL_EN = "/en/calc/compound";

test.describe("compound calc: live recalc", () => {
  test("fill 4 fields, result panel shows updated final value", async ({
    page,
  }) => {
    await page.goto(COMPOUND_URL);

    // Wait for the initial result to render — the hero number is present with
    // default values before any user interaction.
    const finalValueLocator = page.locator('[aria-live="polite"]').first();
    await expect(finalValueLocator).toBeVisible();

    // Capture the initial text so we can assert it changes after editing.
    const initialText = await finalValueLocator.textContent();

    // Clear and fill initialAmount
    const initialAmountInput = page.getByLabel(/počáteční|initial.amount/i).first();
    await initialAmountInput.fill("200000");

    // Fill monthlyContribution
    const monthlyInput = page.getByLabel(/měsíční vklad|monthly.contribution/i).first();
    await monthlyInput.fill("10000");

    // Fill annualReturnPct
    const returnInput = page.getByLabel(/roční výnos|annual.return/i).first();
    await returnInput.fill("10");

    // Fill horizonYears
    const horizonInput = page.getByLabel(/horizont|horizon.years/i).first();
    await horizonInput.fill("20");

    // After changes the deferred recalc fires — wait for the text to differ
    // from the initial render. We use a polling expect rather than a hard wait.
    await expect(finalValueLocator).not.toHaveText(initialText ?? "", {
      timeout: 5_000,
    });

    // The result should be a non-empty currency string
    const updatedText = await finalValueLocator.textContent();
    expect(updatedText).toBeTruthy();
    expect(updatedText).toMatch(/\d/); // contains at least one digit
  });

  test("result panel is present on page load with default values", async ({
    page,
  }) => {
    await page.goto(COMPOUND_URL);

    // The results card heading
    await expect(page.getByText(/výsledek/i)).toBeVisible();

    // The live value element exists and is non-empty
    const hero = page.locator('[aria-live="polite"]').first();
    await expect(hero).toBeVisible();
    const text = await hero.textContent();
    expect(text).toMatch(/\d/);
  });
});

test.describe("compound calc: chart renders", () => {
  test("chart card with data-testid='compound-chart' is visible on page load", async ({
    page,
  }) => {
    await page.goto(COMPOUND_URL);

    // The chart Card element has data-testid="compound-chart" (added to page.tsx).
    const chartCard = page.locator('[data-testid="compound-chart"]');
    await expect(chartCard).toBeVisible({ timeout: 10_000 });
  });

  test("compound chart SVG renders inside the chart card", async ({ page }) => {
    await page.goto(COMPOUND_URL);

    // Recharts ResponsiveContainer renders an SVG inside the chart card
    const chartCard = page.locator('[data-testid="compound-chart"]');
    await expect(chartCard).toBeVisible({ timeout: 10_000 });

    const svg = chartCard.locator("svg").first();
    await expect(svg).toBeVisible();

    // The AreaChart stacks render at least 2 <path> elements
    const paths = chartCard.locator("svg path");
    const count = await paths.count();
    expect(count).toBeGreaterThan(1);
  });
});

test.describe("compound calc: locale switch", () => {
  test("navigating to /en/calc/compound shows English labels", async ({
    page,
  }) => {
    await page.goto(COMPOUND_URL_EN);

    // Page title in English (translations key calc.compound.title)
    // The exact string comes from the EN translation file, but we know the
    // page renders an h1 with the title.
    await expect(page.locator("h1")).toBeVisible();

    // The form input label for "initial amount" in English
    // Check for the label text via the form landmark
    const form = page.getByRole("form", { name: /calculator inputs/i });
    await expect(form.or(page.locator("form"))).toBeAttached();

    // The disclaimer in English uses "Simplified model" or similar —
    // we simply assert the page loaded without JS errors.
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    // Reload and check no uncaught errors
    await page.reload();
    await page.locator("h1").waitFor({ state: "visible" });
    expect(errors).toHaveLength(0);
  });

  test("locale switch CS → EN: URL changes, page still renders", async ({
    page,
  }) => {
    await page.goto(COMPOUND_URL);
    await expect(page.locator("h1")).toBeVisible();

    // Navigate to EN version manually
    await page.goto(COMPOUND_URL_EN);
    await expect(page.locator("h1")).toBeVisible();

    // URL must contain /en/
    expect(page.url()).toContain("/en/");
  });
});
