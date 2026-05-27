import type { SupportedLocale } from "./formatters";

// Live reformat the user-typed text: whitelist digits + one separator, group thousands
// with space, and normalize the decimal separator to the active locale.
// Returns the formatted text and the parsed numeric value (null when empty / partial).
export function reformatRaw(
  raw: string,
  locale: SupportedLocale,
  maxDecimals: number,
): { text: string; value: number | null } {
  // Whitelist: digits, separators, sign. Anything else is dropped (handles paste of "$1,234.5").
  const cleaned = raw.replace(/[^\d.,\-]/g, "");
  const sign = cleaned.startsWith("-") ? "-" : "";
  const body = cleaned.replace(/-/g, "");

  // When both ',' and '.' appear (e.g. pasting "1,234.56" or "1.234,56"), the
  // LAST separator is the decimal point; the earlier ones are thousands separators.
  // When only one type of separator appears we still use the last occurrence as
  // the decimal point so "1.234" in CS locale (typed as "1.234") is treated as a
  // decimal, not as a thousands-separated integer.
  const hasComma = body.includes(",");
  const hasDot = body.includes(".");
  let sepIdx: number;
  if (hasComma && hasDot) {
    // Mixed: last separator is the decimal
    const lastComma = body.lastIndexOf(",");
    const lastDot = body.lastIndexOf(".");
    sepIdx = Math.max(lastComma, lastDot);
  } else {
    // Single type: last occurrence is the decimal (matches live-typing behaviour)
    sepIdx = body.search(/[.,]/);
    // If multiple identical separators, only the last is the decimal
    const allSeps = [...body.matchAll(/[.,]/g)];
    if (allSeps.length > 1) {
      sepIdx = allSeps[allSeps.length - 1]!.index!;
    }
  }

  let intPart = sepIdx >= 0 ? body.slice(0, sepIdx).replace(/[.,]/g, "") : body;
  let decPart = sepIdx >= 0 ? body.slice(sepIdx + 1).replace(/[.,]/g, "") : "";
  // Strip leading zeros (but keep a single "0" if that's all the user typed)
  intPart = intPart.replace(/^0+(?=\d)/, "");
  if (maxDecimals === 0) decPart = "";
  if (decPart.length > maxDecimals) decPart = decPart.slice(0, maxDecimals);

  const decimalDisplay = locale === "cs" ? "," : ".";
  const intGrouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const hasSep = sepIdx >= 0 && maxDecimals > 0;
  const text = sign + intGrouped + (hasSep ? decimalDisplay : "") + decPart;

  if (intPart === "" && decPart === "") return { text, value: null };
  const numStr = sign + (intPart || "0") + (hasSep ? "." + (decPart || "0") : "");
  const n = parseFloat(numStr);
  return { text, value: Number.isFinite(n) ? n : null };
}

// Count digits and separators to the left of `pos` — used to map the caret from
// the pre-format text to the post-format text after live reformatting.
export function caretSig(s: string, pos: number): { digits: number; seps: number } {
  let digits = 0;
  let seps = 0;
  for (let i = 0; i < Math.min(pos, s.length); i++) {
    const c = s[i];
    if (c !== undefined && c >= "0" && c <= "9") digits++;
    else if (c === "." || c === ",") seps++;
  }
  return { digits, seps };
}

export function caretTarget(s: string, target: { digits: number; seps: number }): number {
  let d = 0;
  let sp = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c !== undefined && c >= "0" && c <= "9") d++;
    else if (c === "." || c === ",") sp++;
    if (d === target.digits && sp === target.seps) return i + 1;
  }
  return s.length;
}
