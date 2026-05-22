// Unit tests for lib/safe-redirect.ts (T-026 / SR-003)

import { describe, it, expect } from "vitest";
import { isSafeRedirect, safeRedirect } from "@/lib/safe-redirect";

// ---------------------------------------------------------------------------
// isSafeRedirect
// ---------------------------------------------------------------------------

describe("isSafeRedirect", () => {
  it("allows a plain dashboard path", () => {
    expect(isSafeRedirect("/dashboard")).toBe(true);
  });

  it("allows a path with query string", () => {
    expect(isSafeRedirect("/dashboard?foo=bar")).toBe(true);
  });

  it("allows a nested path", () => {
    expect(isSafeRedirect("/cs/dashboard/scenarios/123")).toBe(true);
  });

  it("rejects protocol-relative URL (//evil.com)", () => {
    expect(isSafeRedirect("//evil.com")).toBe(false);
  });

  it("rejects absolute https URL", () => {
    expect(isSafeRedirect("https://evil.com")).toBe(false);
  });

  it("rejects absolute http URL", () => {
    expect(isSafeRedirect("http://evil.com/path")).toBe(false);
  });

  it("rejects Windows-style backslash path (\\\\evil.com)", () => {
    expect(isSafeRedirect("\\\\evil.com")).toBe(false);
  });

  it("rejects backslash embedded in otherwise-valid path", () => {
    expect(isSafeRedirect("/dashboard\\evil.com")).toBe(false);
  });

  it("rejects javascript: URI scheme", () => {
    expect(isSafeRedirect("javascript:alert(1)")).toBe(false);
  });

  it("rejects javascript: scheme that starts with /", () => {
    // Some implementations naively check startsWith('/') only
    expect(isSafeRedirect("/javascript:alert(1)")).toBe(false);
  });

  it("rejects data: URI", () => {
    expect(isSafeRedirect("data:text/html,<script>alert(1)</script>")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isSafeRedirect("")).toBe(false);
  });

  it("rejects null", () => {
    expect(isSafeRedirect(null)).toBe(false);
  });

  it("rejects undefined", () => {
    expect(isSafeRedirect(undefined)).toBe(false);
  });

  it("rejects a path containing ://", () => {
    // Embedded absolute URL in path segment
    expect(isSafeRedirect("/redirect?url=https://evil.com")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// safeRedirect
// ---------------------------------------------------------------------------

describe("safeRedirect", () => {
  const FALLBACK = "/cs/dashboard";

  it("returns the path when it is safe", () => {
    expect(safeRedirect("/dashboard", FALLBACK)).toBe("/dashboard");
  });

  it("returns fallback for protocol-relative URL", () => {
    expect(safeRedirect("//evil.com", FALLBACK)).toBe(FALLBACK);
  });

  it("returns fallback for absolute URL", () => {
    expect(safeRedirect("https://evil.com", FALLBACK)).toBe(FALLBACK);
  });

  it("returns fallback for null input", () => {
    expect(safeRedirect(null, FALLBACK)).toBe(FALLBACK);
  });

  it("returns fallback for empty string", () => {
    expect(safeRedirect("", FALLBACK)).toBe(FALLBACK);
  });

  it("returns path with query string unchanged", () => {
    expect(safeRedirect("/dashboard?from=email", FALLBACK)).toBe(
      "/dashboard?from=email",
    );
  });
});
