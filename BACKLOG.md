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
- **Status**: pending
- **Blocks**: App Store submission (Privacy Policy URL must resolve before Apple review)
- **Blocked by**: —
- **Brief**: The App Store requires a live Privacy Policy URL before app review. The policy content is written and committed at `apps/mobile/store-listing/privacy-policy.md`. Wire a `/privacy` route on the web app (`https://investio-web.vercel.app/privacy`) to render the English section of that file as a static page. The Czech section can be included as-is below the English text.
- **Inputs**:
  - `apps/mobile/store-listing/privacy-policy.md` — source content (EN + CS)
  - `apps/mobile/store-listing/meta.md` — Privacy Policy URL expectation
  - `apps/mobile/store-listing/privacy-nutrition.md` — references this URL as required for App Store Connect
- **Acceptance criteria**:
  - [ ] `GET https://investio-web.vercel.app/privacy` returns HTTP 200
  - [ ] Page renders English privacy policy text clearly (no raw markdown, no 404)
  - [ ] Czech section also visible on the same page (below the fold or in a second section)
  - [ ] Page is publicly accessible without login
  - [ ] `<title>` and `<meta name="description">` present for the route
  - [ ] No redirect chains — URL resolves directly
- **Cost note**: Sonnet-friendly
- **Notes**: This is a hard blocker for App Store submission. Apple's review team visits the Privacy Policy URL during review. If it 404s, the app will be rejected.
- **Hand-back**: <devops fills in — PR URL / deploy URL after ship>

---

## Activity log

- `2026-05-27` — Marketing agent shipped App Store listing copy (EN + CS) + privacy policy (EN + CS) + privacy nutrition labels + shared metadata. Files at `apps/mobile/store-listing/`. Next: T-001 (devops) to unblock App Store submission.
