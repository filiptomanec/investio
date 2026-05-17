import { ScenarioInputSchema, type ScenarioInput } from "@investio/shared/schemas";

/**
 * Encode a ScenarioInput as a URL-safe Base64 string.
 * Uses btoa(JSON.stringify(...)) + encodeURIComponent for URL safety.
 */
export function encodeScenarioForUrl(input: ScenarioInput): string {
  return encodeURIComponent(btoa(JSON.stringify(input)));
}

/**
 * Decode a Base64-encoded scenario from URL query param.
 * Returns parsed ScenarioInput or null if decode/parse fails.
 */
export function decodeScenarioFromUrl(b64: string): ScenarioInput | null {
  try {
    const decoded = atob(decodeURIComponent(b64));
    const parsed = JSON.parse(decoded);
    const result = ScenarioInputSchema.safeParse(parsed);
    if (!result.success) return null;
    return result.data;
  } catch {
    return null;
  }
}
