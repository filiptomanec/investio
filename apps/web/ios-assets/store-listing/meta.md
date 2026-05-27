# App Store Connect — Shared Metadata

## App identity

| Field | Value |
|---|---|
| App name | Investio |
| Bundle ID | `com.tomanec.investio` |
| Version | 1.0.0 |
| Build number | 1 |
| Copyright | © 2026 Filip Tomanec |
| SKU | `investio-ios-v1` (suggested, editable) |

## Categories

| Field | Value |
|---|---|
| Primary category | Finance |
| Secondary category | Productivity |

## Age rating

| Question | Answer |
|---|---|
| Age rating | 4+ |
| Cartoon or fantasy violence | None |
| Realistic violence | None |
| Sexual content or nudity | None |
| Profanity or crude humor | None |
| Horror or fear themes | None |
| Medical or clinical treatment | None |
| Gambling or contests | None |
| Unrestricted web access | No |
| Gambling | No |

## Advertising identifier (IDFA)

| Field | Value |
|---|---|
| App uses IDFA | No |

_The app ships no advertising SDKs and performs no ad attribution. No ATT prompt is shown._

## Encryption

| Field | Value |
|---|---|
| ITSAppUsesNonExemptEncryption | `false` |
| Declared in | `app.config.ts` → `ios.infoPlist.ITSAppUsesNonExemptEncryption: false` |

_The app uses no cryptographic algorithms beyond standard HTTPS provided by the OS networking stack. Qualifies for the encryption exemption — no annual self-classification report required._

## Sign-in / Demo account

| Field | Value |
|---|---|
| Sign-in required | No |
| Demo account | Not applicable — calculator runs entirely offline, no authentication |

## Devices

| Field | Value |
|---|---|
| iPhone | Yes |
| iPad | Yes (`supportsTablet: true` in app.json) |
| Mac Catalyst | No |
| Apple Vision | No |

## Pricing

| Field | Value |
|---|---|
| Price | Free |
| In-app purchases | None |
| Subscriptions | None |

## URLs

| Field | Value |
|---|---|
| Support URL | https://github.com/filiptomanec/investio |
| Marketing URL | https://investio-web.vercel.app |
| Privacy Policy URL | https://investio-web.vercel.app/privacy |

## Review notes for Apple

> This is a compound-interest calculator. It performs no network requests, collects no user data, requires no permissions, and has no in-app purchases. The app is a pure offline educational tool. All inputs and calculations run on-device using standard arithmetic. The description includes an explicit "Not investment advice" disclaimer. No sign-in or demo account is required — launch the app and the calculator is immediately usable.

## Build pipeline notes

- EAS profile: `production`
- Build command: `eas build --platform ios --profile production`
- Submit command: `eas submit --platform ios`
- Apple Developer Program membership must be active before EAS Submit
- Bundle ID `com.tomanec.investio` must be registered in App Store Connect before first submission
