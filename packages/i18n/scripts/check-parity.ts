/**
 * CI parity check — verifies that cs.json and en.json have identical key sets.
 *
 * Run:   pnpm --filter @investio/i18n check-parity
 * Exit:  0 if keys match, 1 if there is any drift.
 *
 * NOTE: This script should be called in CI pre-merge (see packages/i18n/README.md).
 */

import path from "path";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.join(__dirname, "../locales");

type NestedRecord = { [key: string]: string | NestedRecord };

function deepKeyPaths(obj: NestedRecord, prefix = ""): Set<string> {
  const paths = new Set<string>();
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null) {
      for (const nested of deepKeyPaths(value as NestedRecord, fullKey)) {
        paths.add(nested);
      }
    } else {
      paths.add(fullKey);
    }
  }
  return paths;
}

function loadJson(filename: string): NestedRecord {
  const filePath = path.join(localesDir, filename);
  const raw = readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as NestedRecord;
}

const cs = loadJson("cs.json");
const en = loadJson("en.json");

const csPaths = deepKeyPaths(cs);
const enPaths = deepKeyPaths(en);

const missingInEn: string[] = [];
const extraInEn: string[] = [];

for (const key of csPaths) {
  if (!enPaths.has(key)) {
    missingInEn.push(key);
  }
}

for (const key of enPaths) {
  if (!csPaths.has(key)) {
    extraInEn.push(key);
  }
}

let hasError = false;

if (missingInEn.length > 0) {
  console.error("Keys present in cs.json but MISSING in en.json:");
  for (const key of missingInEn.sort()) {
    console.error(`  - ${key}`);
  }
  hasError = true;
}

if (extraInEn.length > 0) {
  console.error("Keys present in en.json but MISSING in cs.json:");
  for (const key of extraInEn.sort()) {
    console.error(`  + ${key}`);
  }
  hasError = true;
}

if (hasError) {
  console.error(
    `\nParity check FAILED: ${missingInEn.length} missing, ${extraInEn.length} extra keys in en.json.`
  );
  process.exit(1);
} else {
  console.log(
    `Parity check PASSED: ${csPaths.size} keys in both cs.json and en.json.`
  );
  process.exit(0);
}
