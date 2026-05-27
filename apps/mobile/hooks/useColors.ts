import { hexTokens } from "../lib/tokens";
import type { Theme } from "../lib/tokens";

/**
 * Returns the resolved hex color palette for the given theme.
 * Use for chart series colors, status bar, and other cases where
 * Tailwind classes aren't directly applicable.
 */
export function useColors(theme: Theme) {
  return hexTokens[theme];
}
