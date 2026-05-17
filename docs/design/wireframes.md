# Investio — Wireframes (low-fi)

> T-004 deliverable. ASCII low-fi wireframy + user flow + chart specs.
>
> **Konvence**:
>
> - Web wireframy předpokládají viewport ≥ 1024px (lg breakpoint, kde se layout rozšiřuje na 2-column). Mobile wireframy předpokládají 375px width (iPhone SE / běžný Android baseline).
> - `[Btn]` = button, `[ tab ]` = navigation tab, `<icon>` = lucide icon, `____` = input field, `▼` = select dropdown, `╳` = close, `≡` = drawer/menu, `↕` = sort/expand.
> - Šedé části (placeholder, hint, muted text) označené jako `(hint)`.
> - Spacing v ASCII je necelo-přesné — pravý layout řeší Tailwind tokens. ASCII jen hierarchie a regions.

## Obsah

1. [User flow diagram](#1-user-flow-diagram)
2. [Landing (web only)](#2-landing-web-only)
3. [Dashboard — web](#3-dashboard--web)
4. [Dashboard — mobile](#4-dashboard--mobile)
5. [Compound interest calc — web](#5-compound-interest-calc--web)
6. [Compound interest calc — mobile](#6-compound-interest-calc--mobile)
7. [Real estate calc — web](#7-real-estate-calc--web)
8. [Real estate calc — mobile](#8-real-estate-calc--mobile)
9. [Comparison view — web](#9-comparison-view--web)
10. [Comparison view — mobile](#10-comparison-view--mobile)
11. [Chart specifications](#11-chart-specifications)
12. [Empty / loading / error states](#12-empty--loading--error-states)

---

## 1. User flow diagram

```
   ┌──────────────────────┐
   │   Anonymous visit    │
   │   (landing /)        │
   └──────────┬───────────┘
              │ click "Vyzkoušet zdarma"
              ▼
   ┌──────────────────────┐         already have account?
   │   /signup            │◄─────────────────────────┐
   │   email + password   │                          │
   │   or Google OAuth    │                          │
   └──────────┬───────────┘                          │
              │ submit + email verify (Supabase)     │
              ▼                                      │
   ┌──────────────────────┐                          │
   │   /dashboard         │◄─── login ──── /login ───┘
   │   (empty state)      │
   │   "Zatím nemáte      │
   │    žádné scénáře"    │
   │   [Nový scénář ▼]    │
   │   [Prozkoumat        │
   │    šablony]          │
   └──────┬───────────────┘
          │
          ├─ "Nový scénář → Složené úročení" ──┐
          ├─ "Nový scénář → Nemovitost"        ├──┐
          └─ "Prozkoumat šablony" → /templates ┘  │
                                                  ▼
                                  ┌──────────────────────┐
                                  │  /calc/compound      │
                                  │  /calc/real-estate   │
                                  │  (live recalc)       │
                                  └─────────┬────────────┘
                                            │ Uložit
                                            ▼
                                  ┌──────────────────────┐
                                  │  POST /api/scenarios │
                                  │  → /dashboard        │
                                  │  (1 scenario in list)│
                                  └─────────┬────────────┘
                                            │
                            ┌───────────────┼───────────────┐
                            ▼               ▼               ▼
              ┌──────────────────┐  ┌────────────┐  ┌──────────────┐
              │ Klik na řádek    │  │ Vybrat 2   │  │ Duplikovat / │
              │ → detail (edit)  │  │ → Porovnat │  │ Smazat       │
              └──────────────────┘  └─────┬──────┘  └──────────────┘
                                          │
                                          ▼
                                ┌──────────────────────┐
                                │  /compare?a=…&b=…    │
                                │  side-by-side        │
                                └─────────┬────────────┘
                                          │ "Export PDF"
                                          ▼
                                ┌──────────────────────┐
                                │  Generated PDF       │
                                │  (download trigger)  │
                                └──────────────────────┘
```

**Anonymous path (no signup)**: `/templates` je veřejné (read-only browse), `/calc/*` lze otevřít s prefilled defaults a hrát si s nimi, ale "Uložit" tlačítko vede na `/signup` s preserved state (vstupy v sessionStorage). Toto je discovery feature — necháme user vyzkoušet kalkulačku, předtím než ho přinutíme se registrovat.

---

## 2. Landing (web only)

Viewport 1280px. Mobile-first scale dolů na 375px (hero stacuje, navigation collapses do hamburger).

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ╔════╗                                                                       │
│  ║ I  ║ Investio              [ Šablony ]  [ O projektu ]   [Přihlásit] [Registrace]
│  ╚════╝                                                                       │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                                                                              │
│            Spočítejte si investici dřív,                                     │
│            než ji uděláte.                                                   │
│                                                                              │
│            Investio porovná akciový fond s nemovitostí                       │
│            na vašem horizontu — bez složitých excel tabulek.                 │
│                                                                              │
│            [ Vyzkoušet zdarma  → ]    [ Prozkoumat šablony ]                 │
│                                                                              │
│            ──────────────────────────────────────────                        │
│            Žádná registrace pro vyzkoušení.                                  │
│            Žádný marketing newsletter, žádný traading bias.                  │
│                                                                              │
│                                                                              │
│                                                                              │
│     ┌──────────────────────────────────────────────────────────┐             │
│     │                                                          │             │
│     │            [ inline animovaný preview grafu              │             │
│     │              compound interest, ~ 30 let,                │             │
│     │              static SVG, ne canvas]                      │             │
│     │                                                          │             │
│     └──────────────────────────────────────────────────────────┘             │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   FEATURES (3-col grid na desktop, stack na mobile)                          │
│                                                                              │
│   ┌────────────────────┐ ┌────────────────────┐ ┌────────────────────┐       │
│   │ <chart-line>       │ │ <home>             │ │ <git-compare>      │       │
│   │                    │ │                    │ │                    │       │
│   │ Složené úročení    │ │ Nemovitost +       │ │ Porovnání scénářů  │       │
│   │                    │ │ cashflow           │ │                    │       │
│   │ ETF, akcie, fondy. │ │                    │ │ Vedle sebe stock   │       │
│   │ Vklad, výnos,      │ │ Hypotéka, pronájem,│ │ vs nemovitost na   │       │
│   │ horizont — graf    │ │ daně, údržba —     │ │ stejném horizontu. │       │
│   │ a finální hodnota. │ │ měsíční cashflow   │ │ Kdo vyhrává?       │       │
│   │                    │ │ a IRR.             │ │                    │       │
│   └────────────────────┘ └────────────────────┘ └────────────────────┘       │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   CTA SECTION (full width, accent background)                                │
│                                                                              │
│              Připraveni si spočítat svojí investici?                         │
│                                                                              │
│              [ Vytvořit účet zdarma  → ]                                     │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   FOOTER                                                                     │
│   Investio © 2026 · Open source · [GitHub] · [Soukromí] · [Kontakt]          │
│                                                  cs | en                     │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Mobile breakpoint < 1024px**:

- Top nav: logo vlevo + ≡ hamburger vpravo, menu items v drawer.
- Hero: stacks (text → preview chart → CTA buttons).
- Features: 1-column stack.

**Brand voice in microcopy**:

- "Spočítejte si investici dřív, než ji uděláte" — actionable, ne hype.
- "Žádný trading bias" — explicit anti-bro.
- Footer "Open source" — důvěra přes transparentnost.

---

## 3. Dashboard — web

Viewport ≥ 1024px. Empty state varianta + populated state.

### 3.1 Empty state

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  [I] Investio        Dashboard  Šablony           <bell> <avatar-iniciály>   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Moje scénáře                                          [ + Nový scénář ▼ ]   │
│                                                              ├ Složené úročení│
│  ┌────────────────────────────────────────────────┐          └ Nemovitost    │
│  │                                                │                          │
│  │              <chart-line icon, 64px>           │                          │
│  │                                                │                          │
│  │     Zatím nemáte žádné scénáře.                │                          │
│  │                                                │                          │
│  │     Vytvořte první kalkulačku nebo si projděte │                          │
│  │     předpřipravené šablony.                    │                          │
│  │                                                │                          │
│  │     [ Vytvořit první scénář ]                  │                          │
│  │     [ Prozkoumat šablony ]                     │                          │
│  │                                                │                          │
│  └────────────────────────────────────────────────┘                          │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Populated state

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  [I] Investio        Dashboard  Šablony           <bell> <avatar-iniciály>   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Moje scénáře                                          [ + Nový scénář ▼ ]   │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ <search>  Hledat…                       Typ: [ Vše ▼ ]  Řadit: [ Naposledy ▼]│
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  □ Vybrat vše  (vybráno: 2)            [ Porovnat (2) ]  [ Smazat ]          │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ ☑ │ Typ │ Název                  │ Horizont │ Finální hodnota │ Upraveno │  │
│  ├────────────────────────────────────────────────────────────────────────┤  │
│  │ ☑ │ <line>│ S&P 500 — 30 let     │ 30 let   │ 4 521 880 Kč    │ před 2 h │…│
│  │ ☑ │ <home>│ Pražský byt 2+kk     │ 25 let   │ 8 320 000 Kč    │ včera    │…│
│  │ □ │ <line>│ Konzervativní 5 %    │ 20 let   │ 1 240 500 Kč    │ 12. 5. 2026│…│
│  │ □ │ <home>│ Brno činovní dům     │ 30 let   │ 18 750 000 Kč   │ 10. 5. 2026│…│
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  Šablony (read-only)                                  [ Zobrazit všechny → ] │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐              │
│  │ <line>           │ │ <home>           │ │ <line>           │              │
│  │ S&P 500          │ │ Pražský 2+kk     │ │ CZ Dividend ETF  │              │
│  │ 1995-2025        │ │ průměr 2024      │ │ 2010-2025        │              │
│  │                  │ │                  │ │                  │              │
│  │ [Kopírovat]      │ │ [Kopírovat]      │ │ [Kopírovat]      │              │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘              │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Klíčové prvky**:

- **Bulk select + Compare** — primary multi-scenario action, exposed dimensionálně (po výběru 2 řádků se aktivuje tlačítko `[ Porovnat (2) ]`).
- **Inline filtr** (Type select + sort) — pokud > ~10 scénářů.
- **Tabular numbers** v "Finální hodnota" sloupci — `tabular-nums` Tailwind class.
- **"…" overflow menu** na konci řádku: Otevřít / Duplikovat / Sdílet odkaz / Smazat.
- **Šablony row** pod tabulkou — drobné CTA, ne hero card.

---

## 4. Dashboard — mobile

375px width. Vertical scroll. Žádné multi-column.

```
┌─────────────────────────────┐
│ ≡   Investio        <bell>  │  topbar fixed
├─────────────────────────────┤
│                             │
│ Moje scénáře                │
│                             │
│ ┌─────────────────────────┐ │
│ │ <search>  Hledat…       │ │
│ └─────────────────────────┘ │
│ [Vše] [Akcie] [Nemovitost]  │  segmented control
│                             │
│ ┌─────────────────────────┐ │
│ │ <line>   30 let         │ │
│ │ S&P 500 — 30 let        │ │
│ │ 4 521 880 Kč            │ │
│ │ Upraveno před 2 h     ⋮ │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ <home>   25 let         │ │
│ │ Pražský byt 2+kk        │ │
│ │ 8 320 000 Kč            │ │
│ │ Upraveno včera        ⋮ │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ <line>   20 let         │ │
│ │ Konzervativní 5 %       │ │
│ │ 1 240 500 Kč            │ │
│ │ 12. 5. 2026           ⋮ │ │
│ └─────────────────────────┘ │
│                             │
│ Šablony                     │
│ ┌─────────────────────────┐ │
│ │ <line> S&P 500          │ │
│ │ 1995-2025      [Kopír.] │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ <home> Pražský 2+kk     │ │
│ │ průměr 2024    [Kopír.] │ │
│ └─────────────────────────┘ │
│                             │
├─────────────────────────────┤
│  <home>   <chart>   <user>  │  tab bar (Dashboard | Nový | Účet)
│   Dashbo    Nový    Účet    │  + FAB style "Nový" v centru
└─────────────────────────────┘
```

**Mobile-specific**:

- **Swipe-to-action** na card: swipe vlevo → "Smazat / Duplikovat / Sdílet", swipe vpravo → "Porovnat" (přidá do compare basket).
- **Compare basket** — když user přidá scenario do "compare", spodní bar zobrazí `[ 1/2 ] [ Porovnat ▶ ]`. Po druhém přidání → otevře comparison view.
- **Pull-to-refresh** na list (Supabase refetch).
- **Bottom tab bar** s 3 items: Dashboard, Nový (FAB-style central), Účet.

---

## 5. Compound interest calc — web

Viewport ≥ 1024px. Form vlevo (40 %), výsledky + graf vpravo (60 %). Live recalc.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  [I] Investio                       Dashboard  Šablony          <avatar>     │
├──────────────────────────────────────────────────────────────────────────────┤
│  ← Zpět na dashboard                              [Uložit jako…] [Sdílet]    │
│                                                                              │
│  Složené úročení                                                             │
│  Spočítáme finální hodnotu pravidelného vkladu se zhodnocením.               │
│                                                                              │
│  ┌─────────────────────────────────┐ ┌──────────────────────────────────────┐│
│  │ VSTUPY                          │ │ VÝSLEDEK                             ││
│  │                                 │ │                                      ││
│  │ Název scénáře                   │ │  Konečná hodnota                     ││
│  │ ┌─────────────────────────────┐ │ │  4 521 880 Kč                        ││
│  │ │ S&P 500 — 30 let            │ │ │                                      ││
│  │ └─────────────────────────────┘ │ │  ┌─────────────┬─────────────────┐   ││
│  │                                 │ │  │ Vloženo     │ Zhodnocení      │   ││
│  │ Počáteční částka                │ │  │ 1 200 000 Kč│ +3 321 880 Kč   │   ││
│  │ ┌─────────────────────────────┐ │ │  │             │ +276,8 %        │   ││
│  │ │ 100 000               Kč    │ │ │  └─────────────┴─────────────────┘   ││
│  │ └─────────────────────────────┘ │ │                                      ││
│  │ ━━━━●━━━━━━━━━━━━━━ slider     │ │  ┌────────────────────────────────┐   ││
│  │ 0           1 000 000           │ │  │                                │   ││
│  │                                 │ │  │       [ stacked area chart ]   │   ││
│  │ Měsíční vklad                   │ │  │       Y: hodnota (Kč)          │   ││
│  │ ┌─────────────────────────────┐ │ │  │       X: měsíce (0..360)       │   ││
│  │ │ 5 000                  Kč   │ │ │  │       Series 1: vklady (muted) │   ││
│  │ └─────────────────────────────┘ │ │  │       Series 2: zhodnocení     │   ││
│  │                                 │ │  │                                │   ││
│  │ Roční výnos                     │ │  │       hover → tooltip:         │   ││
│  │ ┌─────────────────────────────┐ │ │  │       "měsíc 180 / 4 r."       │   ││
│  │ │ 7,0                   %     │ │ │  │       vloženo: 980 000         │   ││
│  │ └─────────────────────────────┘ │ │  │       hodnota: 2 100 000       │   ││
│  │ ━━━━━●━━━━━━━━━━━━━ -10  +20    │ │  └────────────────────────────────┘   ││
│  │                                 │ │                                      ││
│  │ Horizont                        │ │  Detail výpočtu                     ↕││
│  │ ┌─────────────────────────────┐ │ │  ┌────────────────────────────────┐   ││
│  │ │ 30                    let   │ │ │  │ Měsíční sazba: 0,565 % (geom.) │   ││
│  │ └─────────────────────────────┘ │ │  │ Celkem vkladů: 1 200 000 Kč    │   ││
│  │ ━━━━━━━━●━━━━━━━━━━ 1   50      │ │  │ Celkem zhodnoceno: 3 321 880   │   ││
│  │                                 │ │  └────────────────────────────────┘   ││
│  │ Vklad načasování     [ Konec ▼ ]│ │                                      ││
│  │   ⓘ Konec měsíce = vklad        │ │                                      ││
│  │     se zhodnocuje od příštího   │ │                                      ││
│  │     měsíce.                     │ │                                      ││
│  └─────────────────────────────────┘ └──────────────────────────────────────┘│
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Klíčové prvky**:

- **Live recalc** s 150ms debounce — neukazuje "Calculating…" spinner u běžných změn, jen smooth chart tween (deliberate 500ms easing).
- **Sliders + numeric input** — paralelně. User může napsat přesné číslo nebo táhnout slider. Sync přes controlled state.
- **Tooltip help icon** (`ⓘ`) u méně jasných polí (vklad načasování, default contributionTiming = "end").
- **"Detail výpočtu" expandable** — defaultně zavřený, ukáže `monthlyRate` a další "transparency" hodnoty pro power-userov které chtějí ověřit kalkulaci.
- **Save state**: `[Uložit jako…]` otevře dialog "Jméno scénáře" → POST /api/scenarios.

---

## 6. Compound interest calc — mobile

375px. Stack vertikálně: výsledek hero nahoru, graf, formulář dole. Tap-and-edit.

```
┌─────────────────────────────┐
│ ← Složené úročení      ⋮    │
├─────────────────────────────┤
│                             │
│   Konečná hodnota           │
│   4 521 880 Kč              │
│                             │
│   ┌───────┬───────────────┐ │
│   │Vloženo│ Zhodnocení    │ │
│   │ 1,2 M │ +3,3 M        │ │
│   │       │ +276,8 %      │ │
│   └───────┴───────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │  [ stacked area chart ] │ │
│ │  height ~ 200px         │ │
│ │  tap → tooltip          │ │
│ │  swipe X → scrub        │ │
│ └─────────────────────────┘ │
│                             │
├─────────────────────────────┤
│ VSTUPY                      │
│                             │
│ Počáteční částka            │
│ ┌─────────────────────────┐ │
│ │ 100 000             Kč  │ │  tap → numeric keyboard
│ └─────────────────────────┘ │
│ ━━━━●━━━━━━━━━━━━━━━━━━━    │
│                             │
│ Měsíční vklad               │
│ ┌─────────────────────────┐ │
│ │ 5 000               Kč  │ │
│ └─────────────────────────┘ │
│                             │
│ Roční výnos                 │
│ ┌─────────────────────────┐ │
│ │ 7,0                 %   │ │
│ └─────────────────────────┘ │
│                             │
│ Horizont                    │
│ ┌─────────────────────────┐ │
│ │ 30                  let │ │
│ └─────────────────────────┘ │
│                             │
│ ▼ Pokročilé                 │
│   (collapsed: timing, …)    │
│                             │
│ ┌─────────────────────────┐ │
│ │  [ Uložit scénář ]      │ │  sticky CTA bottom
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

**Mobile-specific**:

- **Hero result NAHOŘE** — uživatel chce vidět výsledek hned, ne scrollovat dolů.
- **Sticky Save button** na bottom (above tab bar) — explicit save action, nepotřebuje scrolling.
- **Pokročilé fields ve "▼ Pokročilé" accordion** — `contributionTiming` apod. nepotřebuje výchozí viditelnost.
- **Numeric keyboard** s decimal point — `keyboardType="decimal-pad"`.
- **Format on blur**: user typuje `100000` → blur → display `100 000 Kč`. Field internally drží number.

---

## 7. Real estate calc — web

Viewport ≥ 1024px. Form má 4 logické sekce (koupě / financování / příjmy / náklady), použijeme **tabs** (ne accordion na desktop — accordion zabírá víc vertikálního space). Výsledky pod formem (full width row) + 2 grafy.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  [I] Investio                       Dashboard  Šablony          <avatar>     │
├──────────────────────────────────────────────────────────────────────────────┤
│  ← Zpět na dashboard                              [Uložit jako…] [Sdílet]    │
│                                                                              │
│  Nemovitost & cashflow                                                       │
│  Měsíční cashflow, IRR a růst equity při koupi investiční nemovitosti.       │
│                                                                              │
│  Název scénáře                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │ Pražský byt 2+kk                                                     │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │ [ Koupě ] [ Financování ] [ Příjmy ] [ Náklady ]                     │    │
│  ├──────────────────────────────────────────────────────────────────────┤    │
│  │                                                                      │    │
│  │  KOUPĚ                                                               │    │
│  │                                                                      │    │
│  │  Kupní cena                                                          │    │
│  │  ┌──────────────────┐                                                │    │
│  │  │ 6 500 000   Kč   │                                                │    │
│  │  └──────────────────┘                                                │    │
│  │                                                                      │    │
│  │  Vlastní kapitál (down payment)                                      │    │
│  │  ┌──────────────────┐                                                │    │
│  │  │ 1 300 000   Kč   │                                                │    │
│  │  └──────────────────┘     20,0 % z kupní ceny                        │    │
│  │                                                                      │    │
│  │  Roční zhodnocení nemovitosti                                        │    │
│  │  ┌──────────────────┐                                                │    │
│  │  │ 3,0         %    │                                                │    │
│  │  └──────────────────┘                                                │    │
│  │                                                                      │    │
│  │  Horizont                                                            │    │
│  │  ┌──────────────────┐                                                │    │
│  │  │ 25         let   │                                                │    │
│  │  └──────────────────┘                                                │    │
│  │                                                                      │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │ VÝSLEDEK                                                             │    │
│  ├──────────────────────────────────────────────────────────────────────┤    │
│  │ Měsíční       Roční yield   IRR (ann.)    Equity final  Break-even   │    │
│  │ cashflow       čistý                                     month        │    │
│  │ +4 250 Kč     4,2 %        7,8 %         8 320 000 Kč   12. měsíc    │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────┐ ┌────────────────────────────────┐  │
│  │ Cashflow per měsíc                  │ │ Equity build-up                │  │
│  │ ┌─────────────────────────────────┐ │ │ ┌────────────────────────────┐ │  │
│  │ │                                 │ │ │ │                            │ │  │
│  │ │   [ stacked bar / line: rent,   │ │ │ │  [ stacked area:           │ │  │
│  │ │     expenses, mortgage payment, │ │ │ │    propertyValue +         │ │  │
│  │ │     tax — components per měsíc] │ │ │ │    -remainingBalance ]     │ │  │
│  │ │                                 │ │ │ │                            │ │  │
│  │ │   X: měsíce 1..300              │ │ │ │  X: měsíce 1..300          │ │  │
│  │ │   Y: Kč (positive + negative)   │ │ │ │  Y: Kč                     │ │  │
│  │ │                                 │ │ │ │                            │ │  │
│  │ └─────────────────────────────────┘ │ │ └────────────────────────────┘ │  │
│  └─────────────────────────────────────┘ └────────────────────────────────┘  │
│                                                                              │
│  ▼ Měsíční cashflow detail (tabulka, default collapsed)                      │
│                                                                              │
│  ⚠ Zjednodušený daňový model. Konzultujte s daňovým poradcem.                │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Tab content sketch**:

- **Koupě** — kupní cena, down payment, appreciation %, horizont
- **Financování** — hypotéka úroková sazba, splatnost, exit month (optional)
- **Příjmy** — měsíční pronájem, vacancy rate, rent growth
- **Náklady** — měsíční expenses, údržba %, daň pásmo (15/23 %)

**Validation pattern**:

- Inline error pod fieldem (red border + `aria-describedby`).
- "Vlastní kapitál > kupní cena" → blokuje výpočet, error toast.
- "Horizont > splatnost hypotéky" → warning info banner ("Po splatnosti hypotéky budete jen vybírat nájem"), ale výpočet pokračuje.

**Disclaimer** dole — daňový model je zjednodušený. Mandatorní v MVP per ADR-0001 calc primitives sekce.

---

## 8. Real estate calc — mobile

375px. Sekce jako **accordion** (ne tabs — tabs na mobile mají špatný discoverability), výsledky hero nahoře.

```
┌─────────────────────────────┐
│ ← Nemovitost           ⋮    │
├─────────────────────────────┤
│                             │
│   Měsíční cashflow          │
│   +4 250 Kč   <arrow-up>    │
│                             │
│   ┌────────┬──────────┐     │
│   │ Yield  │ IRR      │     │
│   │ 4,2 %  │ 7,8 %    │     │
│   └────────┴──────────┘     │
│   Equity za 25 let:         │
│   8 320 000 Kč              │
│   Break-even: 12. měsíc     │
│                             │
├─────────────────────────────┤
│ Cashflow per měsíc          │
│ ┌─────────────────────────┐ │
│ │ [ stacked bar chart ]   │ │
│ │ height ~ 180px          │ │
│ │ swipe X → scrub         │ │
│ └─────────────────────────┘ │
│                             │
│ Equity build-up             │
│ ┌─────────────────────────┐ │
│ │ [ stacked area chart ]  │ │
│ │ height ~ 180px          │ │
│ └─────────────────────────┘ │
│                             │
├─────────────────────────────┤
│ VSTUPY                      │
│                             │
│ ▼ Koupě              [open] │
│   Kupní cena                │
│   ┌──────────────────┐      │
│   │ 6 500 000   Kč   │      │
│   └──────────────────┘      │
│   …                         │
│                             │
│ ▶ Financování               │
│ ▶ Příjmy                    │
│ ▶ Náklady                   │
│                             │
│ ⚠ Zjednodušený daňový model.│
│                             │
│ ┌─────────────────────────┐ │
│ │  [ Uložit scénář ]      │ │  sticky
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

**Mobile-specific**:

- **Accordion sections** místo tabs — vertical scroll je primary, accordion sedí líp.
- **Hero metric kombo**: Cashflow (primary) + yield + IRR + equity final + break-even. Pět čísel je hraniční hodně, ale na nemovitost je IRR a break-even kritický info.
- **Charts mezi výsledky a vstupy** — uživatel scrolluje dolů "investigate input → look at result chart → adjust input".

---

## 9. Comparison view — web

Viewport ≥ 1024px. Side-by-side 2 sloupce + společný graf nad nimi (trajektorie obou).

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  [I] Investio                       Dashboard  Šablony          <avatar>     │
├──────────────────────────────────────────────────────────────────────────────┤
│  ← Zpět na dashboard                              [Sdílet odkaz] [Export PDF]│
│                                                                              │
│  Porovnání scénářů                                                           │
│  S&P 500 — 30 let  vs  Pražský byt 2+kk                                      │
│                                                                              │
│  Společný horizont: 25 let (zkráceno z 30 / 25)                              │
│  Normalizovaný počáteční kapitál: 1 300 000 Kč                               │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │                                                                      │    │
│  │  [ overlay line chart — 2 series, A (teal) vs B (amber) ]            │    │
│  │  X: roky 0..25 (axis label: "let")                                   │    │
│  │  Y: hodnota Kč (compact: "1,2 M Kč", "8 M Kč")                       │    │
│  │  Legenda: ● Akcie (teal)  ● Nemovitost (amber)                       │    │
│  │  Tooltip on hover: měsíc + obě hodnoty + diff                        │    │
│  │  height ~ 400px                                                      │    │
│  │                                                                      │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────┐ ┌────────────────────────────────┐  │
│  │ ● SCÉNÁŘ A                          │ │ ● SCÉNÁŘ B                     │  │
│  │   S&P 500 — 30 let                  │ │   Pražský byt 2+kk             │  │
│  │   Akciové investice                 │ │   Nemovitost                   │  │
│  │                                     │ │                                │  │
│  │   Vstupy:                           │ │   Vstupy:                      │  │
│  │   • Počáteční: 1 300 000 Kč         │ │   • Kupní cena: 6 500 000 Kč   │  │
│  │   • Měsíční vklad: 5 000 Kč         │ │   • Down payment: 1 300 000 Kč │  │
│  │   • Roční výnos: 7,0 %              │ │   • Pronájem: 22 000 Kč/měs.   │  │
│  │   • Horizont: 30 let → 25 (norm.)   │ │   • Hypotéka 4,5 % / 30 let    │  │
│  │                                     │ │   • Horizont: 25 let           │  │
│  │   Výsledek po 25 letech:            │ │                                │  │
│  │   ────────────────────              │ │   Výsledek po 25 letech:       │  │
│  │   Finální hodnota                   │ │   ────────────────────         │  │
│  │   3 850 000 Kč                      │ │   Finální (equity + cf)        │  │
│  │                                     │ │   8 320 000 Kč                 │  │
│  │   ROI: +196 %                       │ │                                │  │
│  │                                     │ │   ROI: +540 %                  │  │
│  └─────────────────────────────────────┘ └────────────────────────────────┘  │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │                                                                      │    │
│  │   ▲ Scénář B vyhrává                                                 │    │
│  │   Rozdíl: 4 470 000 Kč (+116 %)                                      │    │
│  │                                                                      │    │
│  │   Pozn.: Nemovitost zahrnuje equity + kumulativní cashflow.          │    │
│  │   Akcie nezahrnují daň z prodeje (3 % po 3 letech = 0 v MVP).        │    │
│  │                                                                      │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Klíčové prvky**:

- **Společný graf nahoře** — primary visual. Obě křivky overlay.
- **Side-by-side detail karet** — vstupy + result + ROI.
- **Winner banner** dole — ne hyped, ale informativní. ▲/▼ ikona + diff číslo + diff %.
- **Disclaimer** — explicit o tom, co normalizace zahrnuje a nezahrnuje.
- **[Export PDF]** v topbaru — primary outbound action ze comparison.

---

## 10. Comparison view — mobile

375px. Accordion: graf nahoře, pak A, pak B, pak winner banner. Sticky compare bar nahoře.

```
┌─────────────────────────────┐
│ ← Porovnání           ⋮     │
├─────────────────────────────┤
│ A: S&P 500 30 let           │
│ B: Pražský byt 2+kk         │
│ Horizont: 25 let            │
│                             │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ [ overlay line chart ]  │ │
│ │ A (teal) vs B (amber)   │ │
│ │ height ~ 220px          │ │
│ │ swipe X → scrub tooltip │ │
│ └─────────────────────────┘ │
│ ● A   ● B                   │
│                             │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ ▲ Scénář B vyhrává      │ │
│ │ +4 470 000 Kč (+116 %)  │ │
│ └─────────────────────────┘ │
│                             │
├─────────────────────────────┤
│ ▼ Scénář A                  │
│   S&P 500 — 30 let          │
│   Finální: 3 850 000 Kč     │
│   ROI: +196 %               │
│                             │
│   Vstupy:                   │
│   • Počáteční 1 300 000     │
│   • Měsíční 5 000           │
│   • Výnos 7,0 %             │
│                             │
│ ▶ Scénář B                  │
│                             │
│ ┌─────────────────────────┐ │
│ │  [ Export PDF ]         │ │  sticky
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

---

## 11. Chart specifications

> **Constraint**: Recharts (web) + Victory Native XL (mobile). Wireframe musí počítat s tím, co tyhle knihovny umí.
>
> Victory Native XL **NEMÁ** některé Recharts feature: smooth animated transitions on data change (omezené), reference areas s rotated labels, custom SVG overlays. Wireframe specs jsou napsané, aby fungovaly v obou knihovnách bez fallback hacků.

### 11.1 Compound interest — stacked area chart

| Aspect          | Spec                                                                |
| --------------- | ------------------------------------------------------------------- |
| Type            | Stacked area (2 series)                                             |
| Series 1        | Kumulativní vklady — chart-4 (muted slate), 60 % opacity            |
| Series 2        | Zhodnocení (FV − vklady) — chart-1 (teal)                           |
| X axis          | `month` 0..360. Labels: "Rok 0", "Rok 5", "Rok 10", … (5y ticks)    |
| Y axis          | Hodnota Kč. Labels: compact ("1 M", "2,5 M") via `formatCompact`    |
| Legend          | Pod chartem: "Vklady" + "Zhodnocení", clickable to toggle           |
| Tooltip         | On hover (web) / on press (mobile): "Rok X / Měs. Y" + obě hodnoty  |
| Grid lines      | Horizontal only (subtle, `border` token, 1px dashed)                |
| Negative values | Possible (záporný roční výnos) — Y axis allows negative range       |
| Animation       | On input change: 500ms deliberate easing, tween of data points      |
| Reduced motion  | Instant data change (no tween)                                      |

**Why stacked area, ne line**: kumulativní vklady + zhodnocení = celkem se sčítají do FV. Stacked area vizualizuje "kolik z FV jsou peníze co jsem dal" (muted bottom band) vs "kolik vznikne růstem" (teal top band).

### 11.2 Real estate — cashflow chart (per-month components)

| Aspect          | Spec                                                                |
| --------------- | ------------------------------------------------------------------- |
| Type            | Grouped bar nebo stacked area (decision: stacked area, méně visual noise pro 300 měsíců) |
| Series 1        | Pronájem (effective rent) — chart-1 (teal)                          |
| Series 2        | Hypoteční splátka — chart-5 (red, ne danger semantic ale "out of pocket") |
| Series 3        | Náklady (expenses + maintenance) — chart-4 (slate muted)            |
| Series 4        | Daň — chart-2 (amber, attention)                                    |
| X axis          | `month` 0..horizonYears×12. 5y ticks                                |
| Y axis          | Kč. Positive area = příjem, negative area = výdaj                   |
| Tooltip         | "Měsíc X / Rok Y": příjem, hypotéka, expenses, daň, net cashflow    |
| Net cashflow    | Overlay line (chart-3 blue) přes stacked — primary metrika          |
| Vacancy         | Implicit v "Pronájem" (already × (1 − vacancy))                     |

**Edge case**: po splatnosti hypotéky (`month > termYears×12`) zmizí "Hypoteční splátka" série, vykreslí se jen 3 série. Recharts a Victory Native XL oba zvládnou conditional series (filter z dat).

### 11.3 Real estate — equity build-up chart

| Aspect          | Spec                                                                |
| --------------- | ------------------------------------------------------------------- |
| Type            | Stacked area (2 series — property value + remaining balance)         |
| Series 1        | Property value (rostoucí) — chart-1 (teal), positive area           |
| Series 2        | Remaining mortgage balance (klesající) — chart-5 (red), negative    |
| Net (overlay)   | Equity = propertyValue − remainingBalance — chart-3 (blue) line     |
| X axis          | `month`, 5y ticks                                                   |
| Y axis          | Kč, includes negative range pro remaining balance                   |
| Tooltip         | Property value / Remaining balance / Equity (kumulativně cashflow)  |

### 11.4 Comparison view — overlay line chart

| Aspect          | Spec                                                                |
| --------------- | ------------------------------------------------------------------- |
| Type            | Multi-line (2 series)                                               |
| Series A        | Scénář A trajectory — chart-1 (teal), 2px stroke                    |
| Series B        | Scénář B trajectory — chart-2 (amber), 2px stroke                   |
| X axis          | Roky 0..normalizedHorizon, 5y ticks (CZ: "let")                     |
| Y axis          | Kč, compact format                                                  |
| Crossover       | Pokud křivky cross-over, zvýraznit bod malým markerem (●)           |
| Legend          | Pod chartem, names ze scénářů + barva indicator                     |
| Tooltip         | "Rok X": A hodnota, B hodnota, diff Kč + %                          |
| Annotation      | (Defer to post-MVP) — `breakEvenMonth` marker pro real estate scenarios |

**Recharts vs Victory Native parity check**: oba mají native overlay line support. Pro annotation marker (vertical line v specific X) Victory Native XL používá `VictoryLine` jako separate series; Recharts má `ReferenceLine`. Wireframe vědomě defer annotation do post-MVP, aby nedrželo parity check za nohu.

### 11.5 General chart conventions (oba targets)

- **Tabular numbers** v všech axis labels a tooltipech.
- **Grid lines** horizontal only, 1px, dashed, `border` token.
- **Animation duration**: 500ms (deliberate easing) on data change. Reduced motion → instant.
- **Touch target** (mobile): tooltip aktivuje touch event ≥ 8px radius around point. Pinch-to-zoom **NE** v MVP — chart není explorovatelný, jen informativní.
- **Empty state** (žádná data) — chart komponenta vůbec nerenderuje, místo ní empty placeholder ("Vyplňte vstupy pro zobrazení grafu").
- **Loading state** — skeleton rect na chart area (defer until T-010 vidí jestli to vůbec uvidíme — calc běží lokálně, ne async).

---

## 12. Empty / loading / error states

Každá obrazovka musí mít všechny tři state varianty.

| Screen          | Empty                                                | Loading                                  | Error                                                 |
| --------------- | ---------------------------------------------------- | ---------------------------------------- | ----------------------------------------------------- |
| Dashboard       | "Zatím nemáte žádné scénáře" + CTA na new            | Skeleton 3 rows v tabulce                | Toast "Nepodařilo se načíst scénáře" + retry          |
| Compound calc   | Vstupy default values (S&P 500 like) — never empty   | n/a (calc je sync)                       | Inline form errors per field; toast pro save fail     |
| Real estate     | Vstupy default values — never empty                  | n/a (calc je sync)                       | Form errors; IRR nelze spočítat → result "−" + tooltip|
| Comparison      | "Vyberte 2 scénáře k porovnání" CTA back to dashboard| Skeleton chart                           | "Scénář nenalezen" pokud query param invalid          |
| Login / Signup  | n/a                                                  | Spinner v submit button                  | Inline form error (Supabase auth error mapped to CZ)  |

**Microcopy konvence**:

- Empty: pozitivní akce ("Vytvořte první scénář"), ne disempowering ("Nic tady není").
- Loading: < 500ms = no spinner (avoid flash), 500ms–2s = subtle spinner, > 2s = skeleton + "Načítání…".
- Error: konkrétní akce ("Zkusit znovu", "Zpět na dashboard"), ne dead-end. Vždy raw error text pod fold pro debugging (dev mode).

---

## Out of scope (T-004)

- **Konkrétní validation regex / Zod schema** — fullstack řeší v T-007 (Zod) a T-010 (form integration).
- **Animation choreography detail** — frontend řeší při implementaci, design system definuje jen tokens.
- **Templates UI** (`/templates` browser page) — separátní ticket, low priority MVP. Šablony v dashboardu jsou cards row, samostatná page může počkat.
- **Settings / account page** — boring, defer do M2 polish.
- **PDF design (T-018)** — visual design PDF outputu řeší T-018 ticket s vlastním brief.
- **Marketing landing image / illustrations** — placeholder ASCII chart v hero. T-023 (marketing) přidá ilustrace.
