# Investio — Design system

> Single source of truth pro design rozhodnutí. T-003 deliverable. Implementační podklad pro fullstack (T-005 — `packages/design-tokens/`, `apps/web/app/globals.css`) a mobile (T-014 — `ThemeProvider`).
>
> Companion soubory:
>
> - `tokens.draft.ts` — kanonické TS konstanty (kopírovatelné 1:1)
> - `tailwind-preview.md` — ukázka mapování na `tailwind.config.ts`
> - `wireframes.md` — wireframy obrazovek a chart specs

## 1. Brand voice

Investio je **kalkulačka, ne brokerage**. Cílový uživatel přemýšlí o investici za pár stovek tisíc korun (rekonstrukce bytu, S&P 500 ETF), ne o intradenním tradingu. Tomu odpovídá tón: **friendly + důvěryhodné**, klidné, s respektem k uživatelovým penězům. Žádné FOMO ticker tapes, žádné kýčovité "10x your wealth" headlines, žádné neonové animace zelených svíček.

Vizuální paralela: Lunch Money (klidné, mírně domácí), YNAB (důsledné, edukativní), Linear (precizní, ne pyšné). Hraniční negativní příklady: Robinhood (gamifikace), klasická bankovní intranet UI (sterilní, modré všude).

Praktický překlad voice → UI:

- **Mírné rounded edges** (8px default) místo pure square i místo full pill — autoritativní, ale ne studené.
- **Tlumené sémantické barvy** — success je `#16a34a` (klidná zelená), ne `#00ff00`. Danger je warm red `#dc2626`, ne fire-engine.
- **Tabular čísla všude**, kde se počítá — financial professional respect.
- **Krátké error messages**, žádné "Oops! Something went wrong!" — místo toho "Nepodařilo se uložit scénář. Zkuste znovu."
- **CZ jako primární jazyk**, žádné anglicismy ("scénář", ne "scenario"; "porovnání", ne "compare view").

## 2. Color palette

### 2.1 Brand colors

| Role         | Hex       | Use                                   |
| ------------ | --------- | ------------------------------------- |
| Primary      | `#0d9488` | Primární CTA, link, brand mark        |
| Primary hov  | `#0f766e` | Hover/active state                    |
| Accent       | `#f59e0b` | Secondary highlight, "compare", badge |
| Accent muted | `#fef3c7` | Subtle accent surface (banner)        |

**Volba primary teal**: chladná modrá je default ve fintech, ale Investio chce být teplejší. Teal (modrozelená) drží důvěryhodnost modré a přidává hint růstu/zhodnocení (zelená undertone) bez křiku. Stejný princip používá Lunch Money a doc UI Stripu.

**Pozn.**: `teal-500` (#14b8a6) je vyhrazen jen pro decorative use (ilustrace, ikon fill na světlém pozadí). Pro interaktivní text/UI používáme `teal-700` (#0f766e) — má dostatečný kontrast i na `slate-50` background (5.3:1).

### 2.2 Semantic colors

| Role        | Light          | Dark           | Default use                                |
| ----------- | -------------- | -------------- | ------------------------------------------ |
| success     | `#15803d`      | `#22c55e`      | Saved, IRR positive, "scenario complete"   |
| warning     | `#a16207`      | `#eab308`      | Validation warning ("horizont > 30 let")   |
| danger      | `#dc2626`      | `#ef4444`      | Destructive action, error toast            |
| info        | `#2563eb`      | `#3b82f6`      | Info banner, "did you know" microcopy      |
| destructive | = danger above | = danger above | Pojmenované zvlášť kvůli shadcn konvenci   |

**Pozn. k success / warning**: 700-step varianty (#15803d, #a16207) místo 600-step. 600-step nebyly dost tmavé pro white foreground s AA contrast (success 600 byl jen 3.3:1). 600-step jsou v paletě dál k dispozici pro decorative use bez textu (chart series, badge bez labelu, icon fill).

### 2.3 Neutral scale (Slate, blueish gray)

Ladí s tealem (sdílí blue undertone), na rozdíl od neutrálního gray nepůsobí "studeně bezbarvě".

| Step | Light use                          | Dark use                              |
| ---- | ---------------------------------- | ------------------------------------- |
| 50   | Page background alt, table stripe  | Foreground text                       |
| 100  | Muted surface, secondary button bg | (nepoužíváno)                         |
| 200  | Border, divider                    | (nepoužíváno)                         |
| 400  | Placeholder, disabled foreground   | Muted foreground                      |
| 600  | Muted foreground (body alt)        | (sub-text only)                       |
| 700  | (nepoužíváno)                      | Hover surface                         |
| 800  | (nepoužíváno)                      | Border, divider                       |
| 900  | Foreground text                    | Card background                       |
| 950  | (nepoužíváno)                      | Page background                       |

### 2.4 Semantic mapping (shadcn convention)

Tokeny, na které se odkazují komponenty (`bg-background`, `text-foreground`, …). UI komponenty nesmí použít raw paletu (`bg-slate-100`), pouze sémantické názvy.

| Token                    | Light       | Dark        |
| ------------------------ | ----------- | ----------- |
| background               | `#ffffff`   | `#020617`   |
| foreground               | `#0f172a`   | `#f8fafc`   |
| card                     | `#ffffff`   | `#0f172a`   |
| card-foreground          | `#0f172a`   | `#f8fafc`   |
| primary                  | `#0f766e`   | `#2dd4bf`   |
| primary-foreground       | `#ffffff`   | `#020617`   |
| secondary                | `#f1f5f9`   | `#1e293b`   |
| secondary-foreground     | `#0f172a`   | `#f8fafc`   |
| muted                    | `#f1f5f9`   | `#1e293b`   |
| muted-foreground         | `#475569`   | `#94a3b8`   |
| accent                   | `#fef3c7`   | `#78350f`   |
| accent-foreground        | `#78350f`   | `#fef3c7`   |
| destructive              | `#dc2626`   | `#ef4444`   |
| destructive-foreground   | `#ffffff`   | `#020617`   |
| border                   | `#e2e8f0`   | `#1e293b`   |
| input                    | `#e2e8f0`   | `#1e293b`   |
| ring (focus)             | `#0f766e`   | `#2dd4bf`   |

### 2.5 Chart series

5 distinktních hodnot, srovnatelné v deuteranopia/protanopia simulaci (verified v devtools color-blindness emulator). Pořadí 1→5 je doporučená sekvence (compound = chart-1, real estate = chart-2, etc.).

| # | Light     | Dark      | Role                                |
| - | --------- | --------- | ----------------------------------- |
| 1 | `#0d9488` | `#2dd4bf` | Primary series / scenario A         |
| 2 | `#f59e0b` | `#fbbf24` | Secondary series / scenario B       |
| 3 | `#2563eb` | `#3b82f6` | Tertiary / comparison overlay       |
| 4 | `#64748b` | `#94a3b8` | Muted baseline (contributions only) |
| 5 | `#dc2626` | `#ef4444` | Negative (drawdown, expenses)       |

### 2.6 Contrast ratios (WCAG AA evidence)

Hodnoty vypočítané standardní WCAG 2.1 relative luminance formulí. **AA pass = ≥ 4.5:1 pro normal text, ≥ 3:1 pro large text (≥ 18pt) a UI komponenty / icons.**

Hodnoty níže jsou **měřené** standardní WCAG 2.1 formulí (`(L1 + 0.05) / (L2 + 0.05)`, sRGB relative luminance), ne odhadované.

#### Light mode

| Pair                                       | Ratio   | Pass    |
| ------------------------------------------ | ------- | ------- |
| foreground on background                   | 17.85:1 | AAA     |
| foreground on card                         | 17.85:1 | AAA     |
| muted-foreground on background             | 7.58:1  | AAA     |
| muted-foreground on muted                  | 6.92:1  | AA      |
| primary-foreground on primary              | 5.47:1  | AA      |
| primary on background (link, teal-700)     | 5.47:1  | AA      |
| accent-foreground on accent                | 8.15:1  | AAA     |
| destructive-foreground on destructive      | 4.83:1  | AA      |
| success-foreground on success (green-700)  | 5.02:1  | AA      |
| warning-foreground on warning (yellow-700) | 4.92:1  | AA      |
| info-foreground on info                    | 5.17:1  | AA      |
| ring on background (teal-700, 2px)         | 5.47:1  | AA (text+UI) |
| border on background                       | 1.23:1  | n/a (decorative — neaplikuje se na text/icons) |

#### Dark mode

| Pair                                | Ratio   | Pass |
| ----------------------------------- | ------- | ---- |
| foreground on background            | 19.28:1 | AAA  |
| foreground on card                  | 17.06:1 | AAA  |
| muted-foreground on background      | 7.87:1  | AAA  |
| muted-foreground on muted           | 5.71:1  | AA   |
| primary-foreground on primary       | 10.84:1 | AAA  |
| primary on background (link)        | 10.84:1 | AAA  |
| accent-foreground on accent         | 8.15:1  | AAA  |
| destructive on background           | 5.36:1  | AA   |
| ring on background (teal-400, 2px)  | 10.84:1 | AAA  |

**Slovo o kontrastu `muted-foreground`**: 6.0:1 (light) je deliberátně utlumené — sekundární info má vypadat sekundárně. Pod 4.5:1 ale nikdy nejdeme.

**Co NEMÁ AA kontrast a proč je to OK**:

- `border` na `background` (1.3:1) — borders jsou decorative, neslouží jako primary čitelnost. WCAG na ně nepožaduje.
- `disabled` states (slate-400 na background, 3.2:1) — WCAG explicitně exclude-uje disabled UI z AA požadavku. Pro screen reader pořád musí mít `aria-disabled`.

### 2.7 Color-blindness check

Deuteranopia (red-green deficiency, 8 % mužů) je nejčastější problém u finančních grafů (green-up/red-down konvence). Naše rozhodnutí:

- **Nepoužíváme green=positive / red=negative jako jediný signal**. Vždy doplnit číselným znakem (+/−), arrow ikonou, nebo textovým labelem ("zisk" / "ztráta").
- **Chart series 1 (teal) vs series 2 (amber) jsou snadno distinguishable** ve všech color-blindness simulacích — orthogonal hue přechod (cool vs warm), ne hue rotation v red-green zóně.
- **Comparison view**: scenario A vs B používají teal vs amber, ne green vs red. Diff badge ("A vyhrává") má i icon (▲ / ▼), ne jen barvu.

## 3. Typography

### 3.1 Font stack

System fonts only v MVP. Žádný custom font payload.

```
sans:  -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter,
       "Helvetica Neue", Arial, sans-serif
mono:  ui-monospace, SFMono-Regular, Menlo, "Cascadia Mono", Consolas,
       "Liberation Mono", monospace
```

**Open question, defer to post-MVP**: switchnout na **Geist Sans** (Vercel free font) jednou když landing page (T-023) bude vyžadovat výraznější brand. Zatím system stack stačí.

### 3.2 Type scale (1.2 ratio)

Modulární scale s ratio ~1.2 (minor third). Důvod: finanční UI má hodně hustých čísel v tabulkách; aggressive scale by tlačil h1 daleko od body a UI by působil rozkolísaně.

| Token        | Px   | Rem    | Line-height | Tracking | Weight | Use                          |
| ------------ | ---- | ------ | ----------- | -------- | ------ | ---------------------------- |
| display      | 56px | 3.5    | 1.05        | -0.02em  | 700    | Landing hero only            |
| h1           | 36px | 2.25   | 1.15        | -0.02em  | 700    | Page title                   |
| h2           | 28px | 1.75   | 1.20        | -0.01em  | 600    | Section heading              |
| h3           | 22px | 1.375  | 1.30        | 0        | 600    | Subsection, card title       |
| h4           | 18px | 1.125  | 1.40        | 0        | 600    | Form section, key result num |
| body         | 16px | 1.00   | 1.50        | 0        | 400    | Default                      |
| sm           | 14px | 0.875  | 1.45        | 0        | 400    | Table cells, dense forms     |
| xs           | 12px | 0.75   | 1.40        | 0.025em  | 500    | Labels, caption, badges      |

### 3.3 Numeric rendering

**Pravidlo**: jakékoli číslo, které uživatel může s něčím porovnat (table row vs row, monthly value vs monthly value, axis label), MÁ MÍT `font-variant-numeric: tabular-nums`. Tj.:

- Všechny tabulky cashflow / amortizace
- Hero result hodnoty ("Konečná hodnota: 12 345 678 Kč")
- Chart axis labels
- Chart tooltip čísla
- Form input s number value

Tailwind: utility class `tabular-nums`. RN: `fontVariant: ["tabular-nums"]`.

### 3.4 CZ context — délka textu

ADR-0003 upozorňuje: CZ je cca 1.2-1.4× delší než EN. Konkrétní dopad na design:

- **Buttons**: nikdy ne fix-width. Min-width OK pro vizuální konzistenci, max-width nikdy. Příklady:
  - EN "Save" → CZ "Uložit" (1.5×)
  - EN "Compare" → CZ "Porovnat scénáře" (3×; v UI CZ použijeme jen "Porovnat" pro paritu)
- **Form labels**: 2-line wrap musí být handled bez breaking layoutu. Test text: "Měsíční vklad do investičního scénáře" (38 chars).
- **Numbers + units**: "1 234 567 Kč" je 12 chars, "$1,234,567" je 10 chars. Table column widths se počítají z CZ delšího variantu.
- **Tooltip / popover**: max-width: 320px. Text wraps naturally; nikdy ne ellipsis na popoveru.

## 4. Spacing

4pt grid. Detail v `tokens.draft.ts`. Recap konvencí:

| Use case                              | Token    | Px  |
| ------------------------------------- | -------- | --- |
| Icon ↔ text v buttonu                  | space-2  | 8   |
| Form field padding-y                  | space-2  | 8   |
| Form field padding-x                  | space-3  | 12  |
| Card padding (mobile)                 | space-4  | 16  |
| Card padding (desktop)                | space-6  | 24  |
| Form gap (between fields)             | space-4  | 16  |
| Section gap within page               | space-8  | 32  |
| Page-section gap (landing)            | space-16 | 64  |
| Max content width (desktop)           | —        | 1280 (custom — viz layout) |

## 5. Shadows

4 levels (xs / sm / md / lg). Light mode je tlumené slate-shadow, dark mode shadows are minimal — místo nich `border` separace.

| Level | Use                                          |
| ----- | -------------------------------------------- |
| xs    | Button hover lift, input focus               |
| sm    | Card resting state, dropdown trigger         |
| md    | Popover, command palette, dropdown menu      |
| lg    | Modal, dialog, full-screen sheet             |

## 6. Radius

Default **8px** (`radii.lg`). Konvence:

| Token | Use                                |
| ----- | ---------------------------------- |
| sm 4  | Chip, badge, status pill           |
| md 6  | Small input, segmented control     |
| lg 8  | Card, button, dialog, default       |
| xl 12 | Feature card, hero CTA              |
| 2xl 16| Modal sheet (desktop)               |
| full  | Avatar, status dot, toggle thumb    |

## 7. Motion

| Duration         | Use                                              |
| ---------------- | ------------------------------------------------ |
| fast 120ms       | Hover, button press, micro                       |
| normal 200ms     | Most state changes — DEFAULT                     |
| slow 320ms       | Modal in/out, drawer                             |
| deliberate 500ms | Chart series tween (when changing inputs)        |

**Easing default**: `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out, snappy "land"). In/out aplikujeme pouze pokud explicitně dává smysl (modal open: in, close: out).

### 7.1 Reduced motion (mandatory)

Dvě úrovně guardu:

1. **Global CSS guard** v `globals.css`:

   ```css
   @media (prefers-reduced-motion: reduce) {
     *,
     *::before,
     *::after {
       animation-duration: 0.01ms !important;
       animation-iteration-count: 1 !important;
       transition-duration: 0.01ms !important;
       scroll-behavior: auto !important;
     }
   }
   ```

2. **Per-component `motion-safe:` prefix** pro decorative animace (chart tween, ilustrace na landing, micro-interactions). Functional motion (focus ring, opacity ack) je ok i v reduced-motion pokud je < 100ms.

Mobile (RN): `AccessibilityInfo.isReduceMotionEnabled()` → conditionally disable Reanimated transitions a Victory Native chart animace.

## 8. Iconography

- **Library**: `lucide-react` (web) + `lucide-react-native` (mobile). Stejná set, stejné názvy, stejné props.
- **Sizes**: 16px (inline w/ body), 20px (button), 24px (page-level icon).
- **Stroke**: 1.5 (light), 2 (default), 2.5 (emphasis). Nemix uvnitř jedné obrazovky.
- **Icon-only button**: VŽDY `aria-label`. Tooltip pro sighted users je nice-to-have.

## 9. Accessibility — checklist (must-pass)

- [ ] Všechny foreground/background páry mají AA kontrast (tabulka § 2.6).
- [ ] Focus ring viditelný na všech interaktivních prvcích (`ring` token, 2px offset).
- [ ] Reduced-motion guard v `globals.css` + `motion-safe:` na decorative animations.
- [ ] Icon-only buttons mají `aria-label`.
- [ ] Form inputs mají label (vizuální nebo `aria-label`), error message linked přes `aria-describedby`.
- [ ] Skip-to-content link na začátku body (`<a href="#main">`).
- [ ] Tab order matches visual order. Žádný `tabIndex > 0`.
- [ ] Min tap target 44×44px na mobile (web nemobile může mít 32×32, ale buttons by měly být ≥ 40).
- [ ] Žádný color-only signal (vždy + ikona, text, nebo pattern).
- [ ] `aria-live="polite"` pro toast a recalculation update.

## 10. CZ-specific formátování

Kritické pro důvěryhodnost čísel.

| Co               | Format                  | Příklad                            |
| ---------------- | ----------------------- | ---------------------------------- |
| Měna CZK         | `1 234 567 Kč`          | Mezera jako thousands separator    |
| Měna EUR         | `1 234,56 €`            | Desetinná čárka                    |
| Procenta         | `12,5 %`                | Mezera před `%`                    |
| Datum            | `17. 5. 2026`           | Pozor — mezery kolem teček         |
| Velké hodnoty (chart axis) | `1,2 M Kč` / `850 tis. Kč` | Locale-aware compact     |

Vše přes `Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK" })`. Sdílený helper `formatCurrency(value, currency, locale)` v `packages/shared/src/formatters/currency.ts` (T-009).

**Edge cases**:

- `formatCurrency(0, "CZK", "cs")` → `"0 Kč"` (ne `"0,00 Kč"` — pro 0 schováme decimals)
- `formatCurrency(-1234, "CZK", "cs")` → `"−1 234 Kč"` (typographic minus, ne ASCII hyphen)
- `formatPercent(0.05, "cs")` → `"5,0 %"` (pro chart vždy 1 decimal, pro display 0 decimals — parameter)

## 11. Open questions

- **Primary brand color confirmation**: teal #0d9488 je můj návrh. Pokud user má silný názor (např. preferuje modrý "fintech default" nebo zelený "Czech tax green"), výměna je 5 minut v `tokens.draft.ts`. **Doporučení: ponechat teal, je dostatečně odlišný od konkurence a má dobrou A11Y story.**
- **Custom font**: Defer. Pokud landing (T-023) bude vyžadovat výraznější brand, můžeme přidat Geist Sans. System stack je do té doby OK.
- **Light/dark toggle UX**: system-default + manual override v user settings? Manual override v topbar (slunce/měsíc icon)? **Doporučení**: system-default v MVP, manual override v T-023+ pokud bude prostor.

## 12. Co tento dokument NEPOKRÝVÁ (out of scope)

- **Konkrétní komponentové variants** (Button sizes, Input states beyond default) — spadne na T-010+ při implementaci, kde fullstack použije shadcn defaults s `tokens` overrides.
- **Iconography asset library** — používáme lucide stock, žádné custom icons v MVP.
- **Brand mark / logo** — odložené do T-023 (landing & marketing).
- **Animation library / chart transitions detail** — spadne na frontend implementační tickety podle ADR-0001 (Recharts / Victory Native XL feature set).
- **Email templates** — Supabase Auth defaults v MVP, branded emails v post-MVP.
