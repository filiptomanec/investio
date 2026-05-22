// Safe redirect helper (T-026 / SR-003).
// Prevents open-redirect attacks on the OAuth callback `?next=` parameter.

/**
 * Returns true when `path` is a safe relative redirect target.
 *
 * Rules (any failure → unsafe):
 *  - Must be a non-empty string.
 *  - Must start with a single `/` (relative path anchor).
 *  - Must NOT start with `//` (protocol-relative URL, e.g. //evil.com).
 *  - Must NOT contain `://` anywhere (embedded absolute URL).
 *  - Must NOT contain `\` (Windows-style path that some browsers normalise).
 *  - Must NOT start with well-known non-http URI schemes that survive the
 *    single-slash check (e.g. `javascript:`, `data:`).
 */
export function isSafeRedirect(path: unknown): path is string {
  if (typeof path !== "string" || path.length === 0) return false;
  if (!path.startsWith("/")) return false;
  if (path.startsWith("//")) return false;
  if (path.includes("://")) return false;
  if (path.includes("\\")) return false;
  // Belt-and-suspenders: block any URI scheme that sneaks past the above
  // (e.g. `/javascript:alert(1)` would pass the `/` check above but is still
  //  dangerous in certain browser implementations).
  const lower = path.toLowerCase();
  const dangerousSchemes = ["javascript:", "data:", "vbscript:"];
  for (const scheme of dangerousSchemes) {
    if (lower.includes(scheme)) return false;
  }
  return true;
}

/**
 * Returns `path` if it passes `isSafeRedirect`, otherwise returns `fallback`.
 *
 * @param path     - The candidate redirect path (typically from `?next=`).
 * @param fallback - A known-safe path to use when `path` is rejected.
 */
export function safeRedirect(path: unknown, fallback: string): string {
  return isSafeRedirect(path) ? path : fallback;
}
