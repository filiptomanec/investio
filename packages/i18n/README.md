# @investio/i18n

Shared message bundles (ICU MessageFormat) for web (next-intl) and mobile (i18next).

## Structure

```
packages/i18n/
├── locales/
│   ├── cs.json          # source of truth (CZ — primary market)
│   └── en.json          # parallel structure (EN — secondary)
├── src/
│   ├── index.ts         # typed exports: messages, Locale, defaultLocale, locales
│   └── keys.ts          # MessageKey utility type (all dot-separated key paths)
└── scripts/
    └── check-parity.ts  # CI parity check
```

## Namespaces

| Namespace | Description |
|-----------|-------------|
| `common` | App-wide labels (save, cancel, loading, …) |
| `auth` | Authentication screens |
| `dashboard` | Scenario list |
| `calc.compound` | Compound interest calculator |
| `calc.realEstate` | Real estate cashflow calculator |
| `comparison` | Side-by-side scenario comparison |
| `errors` | User-facing error messages |

## Parity check

Run locally:

```bash
pnpm --filter @investio/i18n check-parity
# or from repo root:
pnpm check-i18n-parity
```

The script compares all deep key paths in `cs.json` vs `en.json` and exits with code 1 if any key is missing or extra.

**CI**: This script MUST be called as a pre-merge step (T-022 will wire it into the GitHub Actions workflow). Until then, run manually before merging translation PRs.

## Adding a new key

1. Add the key to `cs.json` (source of truth).
2. Add the matching key with English value to `en.json`.
3. Run `pnpm check-i18n-parity` to verify parity.
4. TypeScript will pick up the new key via `Messages` type automatically.

## Content

Placeholder values are intentional. T-020 (content agent) will fill final copy.
