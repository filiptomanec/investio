/**
 * E2E: PDF export — T-019
 *
 * STATUS: All tests in this file are skipped.
 *
 * WHY: T-018 (PDF export feature) has not been merged to main at the time
 * T-019 was authored. The export button and /api/export/pdf route do not yet
 * exist in the codebase.
 *
 * WHEN TO UN-SKIP: After T-018 lands on main, remove the test.skip() wrapper
 * and verify:
 *   1. The export button is discoverable (check the component for a
 *      data-testid or accessible name to use as a locator).
 *   2. The download URL is correct (should trigger a binary response with
 *      Content-Type: application/pdf).
 *
 * See PR description for T-019+T-020 for the tracking note.
 */

import { test } from "@playwright/test";

test.skip(
  "pdf export: export button triggers file download",
  async ({ page }) => {
    // When T-018 is merged, implement as follows:
    //
    //   await page.goto("/calc/compound");
    //
    //   // Set up download listener BEFORE clicking the button
    //   const downloadPromise = page.waitForEvent("download");
    //
    //   const exportBtn = page.getByRole("button", { name: /export|pdf|stáhnout/i });
    //   await exportBtn.click();
    //
    //   const download = await downloadPromise;
    //
    //   // Verify the downloaded file has a .pdf extension
    //   expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
    //
    //   // Optionally verify the MIME type via a direct fetch if the endpoint
    //   // is a separate URL:
    //   // const response = await page.request.get("/api/export/pdf?...");
    //   // expect(response.headers()["content-type"]).toContain("application/pdf");

    void page;
  }
);
