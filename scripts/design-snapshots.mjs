/**
 * Design snapshot script — captures every visual surface in light + dark mode
 * at desktop (1440) and mobile (390) viewports.
 *
 * Usage:
 *   pnpm dev                                          # in apps/web
 *   node scripts/design-snapshots.mjs <baseUrl> <outDir>
 *
 * Example:
 *   node scripts/design-snapshots.mjs http://localhost:3002 /tmp/investio-snapshots
 *
 * Requires Playwright installed in apps/web. Falls back gracefully if not
 * available.
 */
import { createRequire } from "node:module";

// Resolve playwright via the apps/web package (where @playwright/test is installed).
// Run this from apps/web (or any folder where @playwright/test resolves).
const require = createRequire(process.cwd() + "/package.json");
const { chromium } = require("@playwright/test");
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const baseUrl = process.argv[2] ?? "http://localhost:3002";
const outDir = process.argv[3] ?? "/tmp/investio-snapshots";

const routes = [
  { path: "/cs", name: "landing-cs" },
  { path: "/en", name: "landing-en" },
  { path: "/cs/calc/compound", name: "calc-compound-cs" },
  { path: "/cs/calc/real-estate", name: "calc-realestate-cs" },
];

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

const themes = ["light", "dark"];

mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
for (const viewport of viewports) {
  for (const theme of themes) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      colorScheme: theme,
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();
    for (const route of routes) {
      await page.goto(baseUrl + route.path, { waitUntil: "networkidle" });
      // Manually set the dark class because next-themes wiring isn't in this app.
      if (theme === "dark") {
        await page.evaluate(() => document.documentElement.classList.add("dark"));
      }
      // Give counters/animations a tick to settle
      await page.waitForTimeout(1600);
      const file = join(
        outDir,
        `${route.name}-${viewport.name}-${theme}.png`
      );
      await page.screenshot({ path: file, fullPage: true });
      console.log("captured", file);
    }
    await context.close();
  }
}
await browser.close();
