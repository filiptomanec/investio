# Investio — Risks & Mitigations

> Top 5 rizik pro MVP. Každé má vlastníka, signal (jak poznáme že se materializuje) a konkrétní mitigaci.

## R-01 — RLS bypass / data leak

- **Severity**: HIGH
- **Likelihood**: Medium (jakákoli chyba v RLS policy nebo Route Handler může otevřít data leak — finanční data jsou citlivá i pro hobby projekt)
- **Vlastník**: architect (definice) + fullstack (implementace) + security (review v T-021)

**Co se může pokazit**:
- RLS policy zapomenutá na nové tabulce → defaultně Postgres povolí všechno authenticated uživateli.
- Service role key omylem committed nebo použitý v client komponentě → bypass RLS úplně.
- Route Handler queryje přes `prisma.scenario.findMany()` bez `where: { userId }` — pokud Prisma session nemá nastavený JWT claim, RLS se neaplikuje na connection (záleží na connection pooling mode).
- `auth.uid()` vrací null v specifických edge case (např. service role connection) → policy `using (auth.uid() = user_id)` projde `null = something`, což je `null`, což policy odřízne — OK. ALE: pokud policy je `using (true)` (typo) → leak.

**Mitigace**:
- **Default-deny pattern**: každá tabulka `alter table ... enable row level security` IHNED po CREATE. Test v T-006 že anon nemůže selectnout cokoli bez explicit policy.
- **Integration test v T-006/T-008**: vytvořit dva test usery, jeden vytvoří scénář, druhý se ho pokusí načíst přes API → musí dostat 404 (ne 200 s daty).
- **Žádný service role key v `apps/web` client side**. Service role je *only* pro server-side admin operace (migrace, seed, troubleshoot). Žádný v `.env.local` mimo `SUPABASE_SERVICE_ROLE_KEY` u CI/migration scripts.
- **`SUPABASE_SERVICE_ROLE_KEY` v `.gitignore` triple-checked**. `.env.local` `.env*` patterns explicit.
- **Pre-commit hook**: scan na `eyJ` prefix (JWT) v stagovaných souborech.
- **Security review (T-021)** s checklistem: každá tabulka má RLS enabled, každá tabulka má `select/insert/update/delete` policies definované, žádný `using (true)` na user-owned tabulkách.
- **Prisma connection**: použijeme **Supabase session pooler** + RLS-aware extension, který před každou query nastaví JWT claim. Spec v T-006.

**Detection**: GitHub repo secret scanner alert; Supabase log advisor warnings; security review findings.

## R-02 — Calc chyby ničí důvěru v produkt

- **Severity**: HIGH
- **Likelihood**: Medium-High (finanční vzorce mají subtle edge cases, hlavně IRR)
- **Vlastník**: architect (vzorce v `architecture.md`) + fullstack (implementace + testy v T-007)

**Co se může pokazit**:
- Záporné nebo nulové IRR případy → Newton-Raphson diverguje nebo vrací NaN → UI ukáže nesmysl ("IRR: NaN %").
- Annual ↔ monthly conversion: `r/12` vs `(1+r)^(1/12)-1` rozdíl je malý ale viditelný — kterou konvenci použijeme? (Naše rozhodnutí: geometric, dokumentováno v `architecture.md`. Bez konzistence se zobrazí jiné číslo než kalkulačka v bance.)
- Daňový model je zjednodušený. User očekává realitu CZ legislativy. Pokud nebude clear disclaimer, dostane frustrovaný feedback.
- Floating point akumulace přes 360 měsíců → poslední řádek tabulky se liší o `0.01 Kč` od součtu předchozích → user uvidí inconsistency.
- Mortgage termYears < horizonYears edge case — když hypotéka skončí, monthlyPayment musí přepnout na 0. Pokud zapomenu, equity přestřelí.

**Mitigace**:
- **Golden master fixtures**: pre-baked tabulka `inputs → expected outputs` ověřená manuálně proti Excelu/online kalkulačkám pro každý vzorec. `packages/shared/src/calc/__fixtures__/*.json`.
- **Test coverage gate ≥ 90 %** v `packages/shared/src/calc/` (Vitest, fails CI pod prahem).
- **Property-based testy** (`fast-check`) pro monotonicity invariants (FV s vyšším horizonem ≥ FV s nižším při r > 0; equity buildup je rostoucí; etc.).
- **UI disclaimer** u každé kalkulačky: "Zjednodušený model. Pro konkrétní rozhodnutí konzultujte finančního/daňového poradce." (i18n klíč `disclaimer.calc`).
- **Edge case handling explicit**:
  - IRR vrátí `null` (ne `NaN`) když Newton-Raphson i bisekce selžou. UI: "IRR nelze spočítat — cashflow má vícero znaménkových změn".
  - r = 0 → fallback uzavřená forma na simple sum.
  - Mortgage splacená → `monthlyPayment = 0` po termYears * 12 měsíci.
- **Konzistence summace**: jeden iterativní loop generuje time series, agregáty jsou poslední řádek (`final = lastEntry.balance`), žádné separátní `reduce` nad time series, které by mohly accumulate jiné rounding error.
- **Cross-check v T-007**: porovnání compound calc s online kalkulačkami (např. Investor.gov compound interest calc). Diff < 0.1 % na deseti náhodných inputs.

**Detection**: failed Vitest gold master, user bug report, manual cross-check.

## R-03 — Web/mobile parita drift

- **Severity**: MEDIUM-HIGH
- **Likelihood**: Medium (různé render targety, různé i18n knihovny, různé chart knihovny — všechno možností pro drift)
- **Vlastník**: architect (struktura) + fullstack + mobile (disciplinovaný re-use)

**Co se může pokazit**:
- Mobile přidá nový input field do real estate, web nepřidá → user uloží scénář v mobilu, otevře na webu, chybějící input crashuje formulář.
- Chart komponenty na webu a mobile renderují stejná data jinak (různý zaokrouhlovací approach, různá osa Y konvence).
- i18n klíč přidán na webu, chybí na mobilu → user vidí raw klíč `calc.compound.newFeature.title`.
- Validation rule v Zod schema upravena, ale jen na webu (kopie schématu místo importu) → mobile přijme invalid data, server odmítne, mobile zobrazí cryptic 400.

**Mitigace**:
- **`packages/shared` je single source of truth** pro Zod schémata. Both apps `import { ScenarioInputsSchema } from "@investio/shared"`. Žádné copy-paste schémat per platform.
- **`packages/i18n` parity check v CI**: script `check-parity.ts` (viz ADR-0003) failuje CI když cs.json a en.json nemají stejné klíče. **Rozšířit**: v T-009 přidat check že každý web `useTranslations` namespace má resolvable klíč v JSON.
- **Sdílené datové schéma pro grafy** v `packages/shared/src/types/chart.ts` — `TimeSeriesPoint`, `ComparisonSeries`. Chart komponenty (web/mobile) přijímají tato data jako prop. Same data shape → same chart logic.
- **PR review checklist**: změna v `packages/shared/schemas` → reviewer musí check mobile + web impl uses new field.
- **Storybook / Expo Storybook** odložené do post-MVP, ale konceptuálně helpful.
- **Manual parity QA v M5** (T-019/T-020) — Maestro + Playwright pokrývají stejný happy path, vstupy jeden ke druhému.

**Detection**: CI parity check, manual QA, user bug reports.

## R-04 — i18n message key drift mezi platformami a runtime missing keys

- **Severity**: MEDIUM
- **Likelihood**: Medium (manuální key management = manuální drift)
- **Vlastník**: fullstack (web i18n) + mobile (i18next setup)

**Co se může pokazit**:
- Klíč existuje v `cs.json`, chybí v `en.json` (nebo opačně). User v EN vidí raw klíč nebo CZ fallback.
- Klíč použitý v kódu (`t("calc.compound.foo")`), ale v JSON neexistuje → runtime render raw klíče.
- Web používá ICU plural format `{count, plural, ...}`, mobile i18next ICU plugin má jiný behavior pro některé edge cases.
- `next-intl` načítá messages přes dynamic import — pokud build cache špatně cachuje, locale switch nezabere.

**Mitigace**:
- **Generated typed keys** (`packages/i18n/src/keys.ts`) — autocomplete + compile-time error pro typo.
- **Parity script v CI**: porovná key paths cs vs en, fail při mismatch.
- **Runtime missing key handler**:
  - `next-intl`: konfigurovat `onError` to throw v dev, log v prod.
  - `i18next`: `parseMissingKeyHandler` + `missingKeyHandler` log.
- **Pre-commit hook**: scan JSX/TSX na hard-coded CZ/EN stringy (pomocí ESLint plugin `i18next/no-literal-string` nebo equivalent).
- **Parity render test** (T-009 nebo T-019): jednoduchý Vitest test, který renderne stejný klíč přes web i mobile i18n setup a porovná output (s mocked locales).
- **ICU edge case test**: pro každý plural key v cs.json testovat one/few/many/other s konkrétními counts.

**Detection**: CI parity check, runtime missing key log, manual locale switch QA.

## R-05 — Performance: live recalc na 30letém horizontu + grafu

- **Severity**: LOW-MEDIUM
- **Likelihood**: Low (calc je matematicky levný), ale UX impact viditelný hned
- **Vlastník**: fullstack (web perf) + mobile (mobile perf)

**Co se může pokazit**:
- User mění slider continuously → calc běží 60×/s → main thread blokovaný → 16ms frame budget porušený → UI laguje.
- Recharts re-render 360 datapointů na každý keystroke (žádný memoization) → re-render hierarchie hluboká.
- Victory Native XL u 360 datapointů zvládá, ale `react-native-reanimated` shared values špatně driven → JS thread blokovaný.
- Mobile low-end Android (Galaxy A series, 2 GB RAM) → form rerender 360 řádků tabulky cashflow → scroll jankuje.

**Mitigace**:
- **Debounce input → calc** 150ms (web), 100ms (mobile). `useDeferredValue` na webu pro nízkoprioritní recalc.
- **Memoize calc** dle hash inputs (`useMemo` na clientu). Calc je čistá funkce, idempotentní.
- **Virtualized cashflow tabulka** — nezobrazovat 360 řádků najednou; default zobrazení per year (30 řádků), opt-in detail per month. Web: `@tanstack/react-virtual`. Mobile: `FlatList` (built-in virtualization).
- **Chart memoization**: `React.memo` na chart komponenty, prop comparison po hash time series.
- **Perf budget v T-019/T-020 QA**: Lighthouse perf score ≥ 90 na web, Maestro flow latency < 500ms reaction time na mobile.
- **Žádný server-side calc** (per architektury): calc na server je zbytečné network overhead, latence ničí UX víc než cokoli jiného.

**Detection**: Lighthouse, manual stress test (slider rapid drag), low-end device QA.

---

## Méně významná rizika (FYI, ne top 5)

- **Vercel free tier hit**: pokud projekt překročí 100 GB bandwidth/měsíc nebo 100k function invocations → upgrade za $20/mo. Hobby projekt unlikely. Monitor v Vercel dashboard.
- **Supabase free tier hit**: 500 MB DB, 1 GB egress. 4 tabulky × průměrná velikost = stovky MB max na 10k uživatelů. Bezpečné.
- **EAS free tier**: 30 build/month free. Stačí pro MVP, žádný produkční release v scope.
- **Doménový lock-in (Vercel/Supabase)**: žádný extrémní lock-in. Next.js běží kde chceš (s deploy efforta). Supabase exit pain (Postgres + Auth + Storage migrace) ale akcept pro hobby.
- **Žádný backup strategy v MVP**: Supabase free tier dělá daily backup automaticky (point-in-time 7 days). OK pro hobby. Pre-prod (M6) přidat manual export script jednou týdně.

## Reference

- ADR-0002 (auth + RLS pattern)
- `docs/architecture.md` — calc primitives (R-02 mitigation source)
- ADR-0003 (i18n strategy — R-04 mitigation)
- BACKLOG.md T-007 (calc testy), T-019/T-020 (E2E QA), T-021 (security review)
