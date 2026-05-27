# App Privacy Nutrition Labels — Investio

_For submission in App Store Connect under App Privacy._

---

## Final privacy label

**Data Not Collected**

Investio does not collect any data from this app.

---

## Category-by-category answers

Answer every category in App Store Connect as follows:

### Data Used to Track You
**None.** Select no data types. The app does not track users across apps or websites owned by other companies, and does not use data for targeted advertising.

### Data Linked to You
**None.** Select no data types. The app does not link any data to the user's identity.

### Data Not Linked to You
**None.** Select no data types. The app collects no data whatsoever — not even anonymously.

---

## Supporting rationale (for internal use / review notes)

| Data type | Collected? | Rationale |
|---|---|---|
| Contact Info (name, email, phone, address) | No | No account, no sign-up, no contact form in app |
| Health & Fitness | No | No HealthKit, no fitness data |
| Financial Info (payment info, credit info) | No | No payment processing, no bank connections |
| Location (precise, coarse) | No | No location services used |
| Sensitive Info | No | None |
| Contacts | No | No address book access |
| User Content (emails, messages, photos, audio, videos, gameplay content, customer support, other) | No | Calculator inputs are transient, never stored or transmitted |
| Browsing History | No | No web view browsing |
| Search History | No | No search functionality |
| Identifiers (User ID, Device ID) | No | No analytics SDKs, no IDFA, no fingerprinting |
| Purchases | No | No in-app purchases |
| Usage Data (product interaction, advertising data, crash data) | No | No analytics SDK, no crash reporter (Sentry deliberately excluded from mobile build) |
| Diagnostics (crash data, performance data, other diagnostic data) | No | No crash reporting. Sentry is absent from `apps/mobile/` per workspace policy (skip on MVP). |
| Other Data | No | — |

---

## Sentry verification note

The workspace memory policy states: "Sentry only for projects with real traffic — skip on hobby/MVP scaffolds." The mobile `DESIGN.md` §1 stack table explicitly records: "Error reporting: None. Per workspace policy, skip Sentry on MVP." Code review of `apps/mobile/package.json` and `app/_layout.tsx` confirms no Sentry dependency is present. The "Diagnostics — crash data" category is therefore answered **No**.

---

## Privacy Policy URL

**https://investio-web.vercel.app/privacy**

Route is live. The `/privacy` page is rendered by `apps/web/src/routes/privacy.tsx` and deployed to Vercel. URL is stable — do not change it.
