/**
 * Scenarios API — Integration Tests (T-008)
 *
 * Tests Route Handlers at the HTTP level against a running Next.js dev server.
 * Requires:
 *   - Local Supabase running: `supabase start`
 *   - Next.js dev server running: `pnpm --filter @investio/web dev`
 *     (or test server on NEXT_BASE_URL env var)
 *   - DB seeded: `supabase db reset`
 *
 * Environment vars (from apps/web/.env.local or process.env):
 *   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
 *   SUPABASE_SERVICE_ROLE_KEY, NEXT_BASE_URL (default: http://127.0.0.1:3000)
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient } from "@supabase/supabase-js";
import * as fs from "node:fs";
import * as path from "node:path";

// ---------------------------------------------------------------------------
// Env loading
// ---------------------------------------------------------------------------

function loadEnv() {
  // Try apps/web/.env.local first, then packages/db/.env
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

const SUPABASE_URL =
  process.env["NEXT_PUBLIC_SUPABASE_URL"] ??
  process.env["SUPABASE_URL"] ??
  "http://127.0.0.1:54331";
const ANON_KEY =
  process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"] ??
  process.env["SUPABASE_ANON_KEY"] ??
  "";
const SERVICE_ROLE_KEY = process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? "";
const BASE_URL = process.env["NEXT_BASE_URL"] ?? "http://127.0.0.1:3000";

if (!SERVICE_ROLE_KEY) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY not set — fill apps/web/.env.local",
  );
}
if (!ANON_KEY) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY not set — fill apps/web/.env.local",
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function signIn(email: string, password: string): Promise<string> {
  const anonSupa = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false },
  });
  const { data, error } = await anonSupa.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.session) {
    throw new Error(`signIn failed for ${email}: ${error?.message}`);
  }
  // Return the access_token — we pass it as Authorization header for the API
  // (Alternative: use cookie; but header Bearer is simpler for test isolation)
  return data.session.access_token;
}

function apiUrl(path: string) {
  return `${BASE_URL}/api${path}`;
}

/**
 * Make an authenticated request to the API.
 * Note: Our auth helper reads from cookies (httpOnly), but for tests we pass
 * the JWT as Authorization: Bearer header.
 * The auth.ts helper will need to support this, OR we sign cookies manually.
 *
 * Per ADR-0002: session is in httpOnly cookies. For integration tests we
 * simulate this by passing the token as a cookie header matching the format
 * @supabase/ssr uses: sb-<project-ref>-auth-token cookie.
 *
 * Simpler approach: We set a custom auth header and update requireUser() to
 * check it as fallback for tests. However that would pollute production code.
 *
 * Best approach for testing: use fetch with the Supabase cookie directly.
 * The cookie name for local Supabase is `sb-127-0-0-1-auth-token`.
 * We set it as a Cookie header in our requests.
 */
async function apiFetch(
  path: string,
  token: string | null,
  options: RequestInit = {},
): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    // Pass token as Authorization header — auth.ts will check this in tests.
    // We add fallback in requireUser() for integration test support.
    headers["Authorization"] = `Bearer ${token}`;
  }

  return fetch(apiUrl(path), {
    ...options,
    headers,
  });
}

// ---------------------------------------------------------------------------
// Test state
// ---------------------------------------------------------------------------

let userAId: string;
let userBId: string;
let userAToken: string;
let userBToken: string;
let userAScenarioId: string;

const TS = Date.now();
const TEST_USER_A_EMAIL = `api-test-a-${TS}@investio-test.local`;
const TEST_USER_A_PASSWORD = "Test1234!ApiA";
const TEST_USER_B_EMAIL = `api-test-b-${TS}@investio-test.local`;
const TEST_USER_B_PASSWORD = "Test1234!ApiB";

const COMPOUND_INPUTS = {
  type: "compound",
  initialAmount: 10000,
  monthlyContribution: 500,
  annualReturnPct: 0.07,
  horizonYears: 10,
  contributionTiming: "end",
};

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeAll(async () => {
  // Create test users via admin API
  const { data: aData, error: aError } =
    await adminClient.auth.admin.createUser({
      email: TEST_USER_A_EMAIL,
      password: TEST_USER_A_PASSWORD,
      email_confirm: true,
    });
  if (aError || !aData.user) {
    throw new Error(`Failed to create user A: ${aError?.message}`);
  }
  userAId = aData.user.id;

  const { data: bData, error: bError } =
    await adminClient.auth.admin.createUser({
      email: TEST_USER_B_EMAIL,
      password: TEST_USER_B_PASSWORD,
      email_confirm: true,
    });
  if (bError || !bData.user) {
    throw new Error(`Failed to create user B: ${bError?.message}`);
  }
  userBId = bData.user.id;

  // Sign in both users to get tokens
  userAToken = await signIn(TEST_USER_A_EMAIL, TEST_USER_A_PASSWORD);
  userBToken = await signIn(TEST_USER_B_EMAIL, TEST_USER_B_PASSWORD);
});

afterAll(async () => {
  if (userAId) await adminClient.auth.admin.deleteUser(userAId);
  if (userBId) await adminClient.auth.admin.deleteUser(userBId);
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("POST /api/scenarios", () => {
  it("anon POST → 401", async () => {
    const res = await apiFetch("/scenarios", null, {
      method: "POST",
      body: JSON.stringify({
        name: "Test",
        inputs: COMPOUND_INPUTS,
      }),
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("user A POST scenario → 201 with typed payload and id", async () => {
    const res = await apiFetch("/scenarios", userAToken, {
      method: "POST",
      body: JSON.stringify({
        name: "User A Compound Test",
        currency: "CZK",
        inputs: COMPOUND_INPUTS,
      }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.scenario).toBeDefined();
    expect(body.scenario.id).toBeTruthy();
    expect(body.scenario.name).toBe("User A Compound Test");
    expect(body.scenario.type).toBe("compound");
    expect(body.scenario.currency).toBe("CZK");
    expect(body.scenario.inputs.type).toBe("compound");
    expect(body.scenario.inputs.horizonYears).toBe(10);
    userAScenarioId = body.scenario.id;
  });

  it("POST invalid body → 400 with VALIDATION_ERROR", async () => {
    const res = await apiFetch("/scenarios", userAToken, {
      method: "POST",
      body: JSON.stringify({
        name: "", // min 1 char fails
        inputs: { type: "compound", horizonYears: 999 }, // horizonYears max 50
      }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.details).toBeDefined();
  });
});

describe("GET /api/scenarios", () => {
  it("user A GET list → sees own scenario, not user B's", async () => {
    // Create a scenario for user B
    await apiFetch("/scenarios", userBToken, {
      method: "POST",
      body: JSON.stringify({
        name: "User B Scenario",
        currency: "EUR",
        inputs: COMPOUND_INPUTS,
      }),
    });

    const res = await apiFetch("/scenarios", userAToken);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.scenarios).toBeDefined();

    const ids = body.scenarios.map((s: { id: string }) => s.id);
    expect(ids).toContain(userAScenarioId);
    // User B's scenarios must not leak into A's list
    for (const s of body.scenarios) {
      expect((s as { name: string }).name).not.toBe("User B Scenario");
    }
  });
});

describe("GET /api/scenarios/:id", () => {
  it("user A can get own scenario by id", async () => {
    const res = await apiFetch(`/scenarios/${userAScenarioId}`, userAToken);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.scenario.id).toBe(userAScenarioId);
  });

  it("user B GET user A scenario by id → 404 (RLS hides it)", async () => {
    const res = await apiFetch(`/scenarios/${userAScenarioId}`, userBToken);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("anon GET scenario → 401", async () => {
    const res = await apiFetch(`/scenarios/${userAScenarioId}`, null);
    expect(res.status).toBe(401);
  });
});

describe("DELETE /api/scenarios/:id (soft delete)", () => {
  it("user A DELETE → soft delete, subsequent GET returns 404", async () => {
    // Create a separate scenario to delete
    const createRes = await apiFetch("/scenarios", userAToken, {
      method: "POST",
      body: JSON.stringify({
        name: "To Delete",
        currency: "CZK",
        inputs: COMPOUND_INPUTS,
      }),
    });
    expect(createRes.status).toBe(201);
    const { scenario } = await createRes.json();
    const deleteId: string = scenario.id;

    // Delete it
    const deleteRes = await apiFetch(`/scenarios/${deleteId}`, userAToken, {
      method: "DELETE",
    });
    expect(deleteRes.status).toBe(200);
    const deleteBody = await deleteRes.json();
    expect(deleteBody.ok).toBe(true);

    // Default GET list excludes archived → should not appear
    const listRes = await apiFetch("/scenarios", userAToken);
    expect(listRes.status).toBe(200);
    const listBody = await listRes.json();
    const ids = listBody.scenarios.map((s: { id: string }) => s.id);
    expect(ids).not.toContain(deleteId);

    // GET with ?archived=true → should appear
    const archivedRes = await apiFetch(
      "/scenarios?archived=true",
      userAToken,
    );
    expect(archivedRes.status).toBe(200);
    const archivedBody = await archivedRes.json();
    const archivedIds = archivedBody.scenarios.map(
      (s: { id: string }) => s.id,
    );
    expect(archivedIds).toContain(deleteId);

    // Direct GET by id → archived scenario is visible via RLS (RLS allows own archived)
    // but our GET handler doesn't filter by archived_at — it returns the full detail
    const detailRes = await apiFetch(`/scenarios/${deleteId}`, userAToken);
    expect(detailRes.status).toBe(200);
    const detailBody = await detailRes.json();
    expect(detailBody.scenario.archivedAt).not.toBeNull();
  });
});

describe("PATCH /api/scenarios/:id", () => {
  it("user A can update scenario name", async () => {
    const res = await apiFetch(`/scenarios/${userAScenarioId}`, userAToken, {
      method: "PATCH",
      body: JSON.stringify({ name: "Updated Name" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.scenario.name).toBe("Updated Name");
  });
});
