import type { Messages } from "./index";

/**
 * Recursively extracts all dot-separated key paths from a nested object type.
 * Used for type-safe translation key access.
 *
 * Example:
 *   type K = KeyPaths<{ common: { save: string; cancel: string } }>
 *   // => "common.save" | "common.cancel"
 */
type KeyPaths<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends Record<string, unknown>
    ? KeyPaths<T[K], Prefix extends "" ? K : `${Prefix}.${K}`>
    : Prefix extends ""
    ? K
    : `${Prefix}.${K}`;
}[keyof T & string];

/** All valid translation key paths derived from the CS source-of-truth bundle. */
export type MessageKey = KeyPaths<Messages>;
