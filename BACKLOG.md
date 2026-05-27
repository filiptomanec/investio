# BACKLOG — `workspaces/investio`

> Single source of truth pro delivery. Orchestrator píše, specialisté čtou + claimují, hand-back přes status změnu + commit/PR link.
> Plné workflow viz `docs/playbooks/backlog-workflow.md`. Linear handoff (pokud používáš) viz `docs/playbooks/agent-handoff.md`.

## Stav

- **Projekt**: `workspaces/investio`
- **Aktivní fáze**: M1 — App Store submission prep
- **Last sync**: 2026-05-27 (marketing — App Store listing copy + privacy policy)
- **Repo**: `filiptomanec/investio`

## Konvence

- **ID**: `T-NNN`, monotónní, **append-only**. Nikdy nepřečíslovávej — láme reference.
- **Status**: `pending` → `in_progress` → `review` → `done` | `blocked` | `cancelled`
- **Owner**: jediný agent. Pokud potřebuješ dvě role, **rozštěp ticket**.
- **Acceptance criteria**: testovatelné checkboxy. „Funguje to" není kritérium.
- **Blocked by / Blocks**: dependency graf. Specialista nesmí začít, dokud blokátoři nejsou `done`.
- **Hand-back**: jediná povinná věta v ticketu po dokončení = link na PR / commit / soubor.

## Tickety

<!-- Orchestrator: nové tickety přidávej DOLŮ. Hotové tickety nesmazávej, jen `done`. -->

### T-001 — Wire `/privacy` route on the web app to render the privacy policy markdown

- **Owner**: devops
- **Status**: done
- **Blocks**: App Store submission (Privacy Policy URL must resolve before Apple review)
- **Blocked by**: —
- **Brief**: The App Store requires a live Privacy Policy URL before app review. The policy content is written and committed at `apps/mobile/store-listing/privacy-policy.md`. Wire a `/privacy` route on the web app (`https://investio-web.vercel.app/privacy`) to render the English section of that file as a static page. The Czech section can be included as-is below the English text.
- **Inputs**:
  - `apps/mobile/store-listing/privacy-policy.md` — source content (EN + CS)
  - `apps/mobile/store-listing/meta.md` — Privacy Policy URL expectation
  - `apps/mobile/store-listing/privacy-nutrition.md` — references this URL as required for App Store Connect
- **Acceptance criteria**:
  - [x] `GET https://investio-web.vercel.app/privacy` returns HTTP 200
  - [x] Page renders English privacy policy text clearly (no raw markdown, no 404)
  - [x] Czech section also visible on the same page (below the fold or in a second section)
  - [x] Page is publicly accessible without login
  - [x] `<title>` and `<meta name="description">` present for the route
  - [x] No redirect chains — URL resolves directly
- **Hand-back**: Route implemented at `apps/web/src/routes/privacy.tsx`. Deployed on next Vercel push to `main`.

---

### T-002 — Fill in EAS project ID and Apple credentials before first build

- **Owner**: user (Filip)
- **Status**: pending
- **Blocks**: T-003 (EAS build), T-004 (App Store submission)
- **Blocked by**: —
- **Brief**: All EAS config is in place but needs real credentials before `eas build` can run.
- **Acceptance criteria**:
  - [ ] `eas init` run (or `extra.eas.projectId` filled in `app.config.ts`)
  - [ ] `appleId`, `ascAppId`, `appleTeamId` filled in `eas.json` `submit.production.ios` block
  - [ ] ASC API key created and set via `eas secret:create`:
        `EXPO_ASC_API_KEY_ID`, `EXPO_ASC_API_KEY_ISSUER_ID`, `EXPO_ASC_KEY_PATH`
  - [ ] `EXPO_TOKEN` GitHub Actions secret set (for CI builds)
  - [ ] Bundle ID `com.tomanec.investio` registered in App Store Connect

---

### T-003 — Run first EAS production build + TestFlight upload

- **Owner**: user (Filip)
- **Status**: pending
- **Blocks**: T-004
- **Blocked by**: T-002
- **Brief**: After T-002 is done, trigger the first real build.
- **Acceptance criteria**:
  - [ ] `pnpm --filter @investio/mobile build:ios:prod` exits with EAS build URL
  - [ ] Build completes on EAS servers (check expo.dev dashboard)
  - [ ] `.ipa` artifact available for download or submitted to TestFlight

---

### T-004 — App Store submission

- **Owner**: user (Filip)
- **Status**: pending
- **Blocks**: —
- **Blocked by**: T-002, T-003
- **Brief**: Submit the production build to App Store review.
- **Acceptance criteria**:
  - [ ] Privacy policy URL resolves (T-001 deployed)
  - [ ] App Store Connect metadata filled (meta.md, store listing copy)
  - [ ] Screenshots uploaded (EN + CS, 6.7" + 5.5" iPhone)
  - [ ] `pnpm --filter @investio/mobile submit:ios` succeeds
  - [ ] App status shows "Waiting for Review" in App Store Connect

---

## Activity log

- `2026-05-27` — Marketing agent shipped App Store listing copy (EN + CS) + privacy policy (EN + CS) + privacy nutrition labels + shared metadata. Files at `apps/mobile/store-listing/`. Next: T-001 (devops) to unblock App Store submission.
- `2026-05-27` — Devops: T-001 done. `/privacy` route wired at `apps/web/src/routes/privacy.tsx`. EAS Build/Submit config written (`eas.json`, `app.config.ts`, `package.json` scripts, `.github/workflows/mobile-build.yml`). Privacy link added to web footer and mobile methodology screen. Opened T-002/T-003/T-004 for remaining human-gated steps.
