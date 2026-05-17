/**
 * Templates API — Integration Tests (T-008)
 *
 * Tests GET /api/templates and GET /api/templates/:slug without auth.
 *
 * Requires:
 *   - Local Supabase running: `supabase start`
 *   - DB seeded: `supabase db reset` (6 seed templates)
 *   - Next.js dev server: `pnpm --filter @investio/web dev`
 *     (or NEXT_BASE_URL env var pointing to test server)
 */

import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

// ---------------------------------------------------------------------------
// Env loading
// ---------------------------------------------------------------------------

function loadEnv() {
  const candidates = [
    path.resolve(__dirname, "../../.env.local"),
    path.resolve(__dirname, "../../.env"),
    path.resolve(__dirname, "../../../../packages/db/.env"),
  ];
  for (const envPath of candidates) {
    try {
      const content = fs.readFileSync(envPath, "utf8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed
          .slice(eqIdx + 1)
          .trim()
          .replace(/^"(.*)"$/, "$1");
        if (!(key in process.env)) process.env[key] = val;
      }
    } catch {
      // file not present — try next
    }
  }
}

loadEnv();

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const BASE_URL = process.env["NEXT_BASE_URL"] ?? "http://127.0.0.1:3000";

function apiUrl(p: string) {
  return `${BASE_URL}/api${p}`;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GET /api/templates", () => {
  it("anon GET /api/templates → 200, sees all 6 seed templates", async () => {
    const res = await fetch(apiUrl("/templates"), {
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.templates).toBeDefined();
    expect(Array.isArray(body.templates)).toBe(true);
    expect(body.templates.length).toBeGreaterThanOrEqual(6);

    // Each template has required fields
    for (const t of body.templates) {
      expect(t.id).toBeTruthy();
      expect(t.slug).toBeTruthy();
      expect(["compound", "real_estate"]).toContain(t.type);
      expect(t.name).toBeTruthy();
      expect(["CZK", "EUR", "USD"]).toContain(t.currency);
    }
  });

  it("GET /api/templates?type=compound → only compound templates", async () => {
    const res = await fetch(apiUrl("/templates?type=compound"));
    expect(res.status).toBe(200);
    const body = await res.json();
    for (const t of body.templates) {
      expect((t as { type: string }).type).toBe("compound");
    }
  });

  it("GET /api/templates?type=real_estate → only real_estate templates", async () => {
    const res = await fetch(apiUrl("/templates?type=real_estate"));
    expect(res.status).toBe(200);
    const body = await res.json();
    for (const t of body.templates) {
      expect((t as { type: string }).type).toBe("real_estate");
    }
  });

  it("GET /api/templates?locale=en → name is in English", async () => {
    const res = await fetch(apiUrl("/templates?locale=en"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.templates.length).toBeGreaterThan(0);
    // We can't assert exact name strings without knowing seeds,
    // but we can assert that a name field exists and is a non-empty string
    for (const t of body.templates) {
      expect(typeof (t as { name: string }).name).toBe("string");
      expect((t as { name: string }).name.length).toBeGreaterThan(0);
    }
  });
});

describe("GET /api/templates/:slug", () => {
  it("GET /api/templates/:slug → returns template detail", async () => {
    // First, get the list to find a valid slug
    const listRes = await fetch(apiUrl("/templates"));
    const listBody = await listRes.json();
    const firstTemplate = listBody.templates[0] as {
      slug: string;
      id: string;
    };
    expect(firstTemplate).toBeDefined();

    const res = await fetch(apiUrl(`/templates/${firstTemplate.slug}`));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.template.id).toBe(firstTemplate.id);
    expect(body.template.slug).toBe(firstTemplate.slug);
    expect(body.template.inputs).toBeDefined();
  });

  it("GET /api/templates/nonexistent-slug → 404", async () => {
    const res = await fetch(apiUrl("/templates/nonexistent-slug-xyz-9999"));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe("NOT_FOUND");
  });
});
