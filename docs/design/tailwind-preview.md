# Tailwind config preview

> Companion k `tokens.draft.ts`. Ukázka, jak by `tailwind.config.ts` a `app/globals.css` měly vypadat až fullstack v T-005 / T-010 přesune tokeny do `packages/design-tokens/` a webovou app založí.
>
> Tento soubor NENÍ kompilovatelný — je to **markdown reference**. Cílem je redukovat handoff misunderstanding.

## 1. `app/globals.css` — CSS custom properties

shadcn/ui konvence: tokens jsou CSS variables, Tailwind je čte přes `var(--token)`. Dark mode přes `.dark` class na `<html>` (next-themes).

```css
/* apps/web/app/globals.css */
@import "tailwindcss";

/* ----------------------------- Tokens ----------------------------------- */

@layer base {
  :root {
    /* sémantické barvy — light mode */
    --background: 0 0% 100%;                /* #ffffff */
    --foreground: 222 47% 11%;              /* slate-900 #0f172a */

    --card: 0 0% 100%;
    --card-foreground: 222 47% 11%;

    --popover: 0 0% 100%;
    --popover-foreground: 222 47% 11%;

    --primary: 174 80% 26%;                 /* teal-700 #0f766e */
    --primary-foreground: 0 0% 100%;

    --secondary: 210 40% 96%;               /* slate-100 #f1f5f9 */
    --secondary-foreground: 222 47% 11%;

    --muted: 210 40% 96%;
    --muted-foreground: 215 19% 35%;        /* slate-600 #475569 */

    --accent: 48 96% 89%;                   /* amber-100 #fef3c7 */
    --accent-foreground: 21 92% 23%;        /* amber-900 #78350f */

    --destructive: 0 72% 51%;               /* red-600 #dc2626 */
    --destructive-foreground: 0 0% 100%;

    --success: 142 72% 29%;                 /* green-700 #15803d (AA on white) */
    --warning: 35 92% 33%;                  /* yellow-700 #a16207 (AA on white) */
    --info:    221 83% 53%;                 /* blue-600 #2563eb */

    --border: 214 32% 91%;                  /* slate-200 #e2e8f0 */
    --input:  214 32% 91%;
    --ring:   174 80% 26%;                  /* teal-700 #0f766e (5.5:1 vs white) */

    /* chart series */
    --chart-1: 174 77% 32%;                 /* teal-600 */
    --chart-2: 38 92% 50%;                  /* amber-500 #f59e0b */
    --chart-3: 221 83% 53%;                 /* blue-600 */
    --chart-4: 215 16% 47%;                 /* slate-500 */
    --chart-5: 0 72% 51%;                   /* red-600 */

    /* radius — DEFAULT */
    --radius: 0.5rem;                       /* 8px */
  }

  .dark {
    --background: 222 47% 5%;               /* slate-950 #020617 */
    --foreground: 210 40% 98%;              /* slate-50 #f8fafc */

    --card: 222 47% 11%;                    /* slate-900 */
    --card-foreground: 210 40% 98%;

    --popover: 222 47% 11%;
    --popover-foreground: 210 40% 98%;

    --primary: 173 80% 51%;                 /* teal-400 #2dd4bf */
    --primary-foreground: 222 47% 5%;

    --secondary: 217 33% 17%;               /* slate-800 #1e293b */
    --secondary-foreground: 210 40% 98%;

    --muted: 217 33% 17%;
    --muted-foreground: 215 20% 65%;        /* slate-400 #94a3b8 */

    --accent: 21 92% 27%;                   /* amber-900 #78350f */
    --accent-foreground: 48 96% 89%;        /* amber-100 #fef3c7 */

    --destructive: 0 84% 60%;               /* red-500 #ef4444 */
    --destructive-foreground: 222 47% 5%;

    --success: 142 71% 45%;                 /* green-500 */
    --warning: 48 96% 53%;                  /* yellow-500 */
    --info:    217 91% 60%;                 /* blue-500 */

    --border: 217 33% 17%;
    --input:  217 33% 17%;
    --ring:   173 80% 51%;                  /* teal-400 */

    --chart-1: 173 80% 51%;
    --chart-2: 43 96% 58%;                  /* amber-400 */
    --chart-3: 217 91% 60%;
    --chart-4: 215 20% 65%;
    --chart-5: 0 84% 60%;
  }
}

/* --------------------------- Base styling -------------------------------- */

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }

  /* Tabular numbers default on .tabular utility */
  .tabular {
    font-variant-numeric: tabular-nums;
  }
}

/* --------------------------- Reduced motion ------------------------------ */

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

> **Proč HSL místo HEX**: Tailwind v4 + shadcn konvence používá space-separated HSL trojici v CSS var. Důvod: umožňuje `bg-primary/50` (opacity modifier) compose přes `hsl(var(--primary) / 0.5)`. S HEX by to nešlo bez `color-mix()` (širší browser support, ale méně canonical).
>
> **HSL hodnoty výše jsou aproximace** k HEX z `tokens.draft.ts` (HSL ↔ HEX má kvůli zaokrouhlování drobný drift, typicky < 3 RGB hodnoty per kanál). Pokud fullstack chce 100% match, doporučuju vygenerovat HSL přes `chroma.color(hex).hsl()` v build skriptu místo manual conversion. Alternativa pro Tailwind v4: použít `@theme { --color-primary: #0f766e; }` syntax (v4 nativně podporuje, hex je idiomatičtější) — ale shadcn templates pořád dávají HSL, takže pro DX consistency držíme HSL.

## 2. `tailwind.config.ts`

```ts
// apps/web/tailwind.config.ts
import type { Config } from "tailwindcss";
import { tokens } from "@investio/design-tokens";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./node_modules/@investio/ui/**/*.{ts,tsx}", // pokud bychom šli na shared UI package
  ],
  theme: {
    container: {
      center: true,
      padding: tokens.spacing[4],
      screens: {
        "2xl": "1280px", // override default — Investio max content je 1280
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        info: "hsl(var(--info))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: tokens.fontFamilies.sans.split(", "),
        mono: tokens.fontFamilies.mono.split(", "),
      },
      fontSize: {
        display: [tokens.fontSize.display.size, {
          lineHeight: String(tokens.fontSize.display.lineHeight),
          letterSpacing: tokens.fontSize.display.letterSpacing,
          fontWeight: "700",
        }],
        // h1..h4, body, sm, xs ditto
      },
      spacing: {
        // Tailwind defaults dostatečné; pouze přidáme custom kde token shape se liší
      },
      boxShadow: {
        xs: tokens.shadows.light.xs,
        sm: tokens.shadows.light.sm,
        md: tokens.shadows.light.md,
        lg: tokens.shadows.light.lg,
        // dark shadows aplikujeme přes :is(.dark) selector v components (manually)
      },
      transitionDuration: {
        fast: tokens.motion.duration.fast,
        normal: tokens.motion.duration.normal,
        slow: tokens.motion.duration.slow,
      },
      transitionTimingFunction: {
        out: tokens.motion.easing.out,
        in: tokens.motion.easing.in,
        "in-out": tokens.motion.easing.inOut,
      },
      zIndex: {
        dropdown: String(tokens.zIndex.dropdown),
        "sticky-nav": String(tokens.zIndex.stickyNav),
        popover: String(tokens.zIndex.popover),
        modal: String(tokens.zIndex.modal),
        toast: String(tokens.zIndex.toast),
        tooltip: String(tokens.zIndex.tooltip),
      },
    },
  },
  plugins: [
    // shadcn-standard: tailwindcss-animate
    require("tailwindcss-animate"),
  ],
};

export default config;
```

## 3. Mobile theme provider preview (RN side)

Mobile nemůže použít CSS var — má JS object místo toho. Stejný `tokens` objekt z `@investio/design-tokens`.

```tsx
// apps/mobile/lib/theme.ts (preview only, fullstack T-014 doimplementuje)
import { tokens } from "@investio/design-tokens";
import { useColorScheme } from "react-native";

export function useInvestioTheme() {
  const scheme = useColorScheme(); // "light" | "dark" | null
  const colors = tokens.colors[scheme === "dark" ? "dark" : "light"];
  return {
    colors,
    spacing: tokens.spacing,
    radii: tokens.radii,
    typography: tokens.fontSize,
    motion: tokens.motion,
  };
}
```

A potom v komponentě:

```tsx
const theme = useInvestioTheme();
<View style={{
  backgroundColor: theme.colors.card,
  borderRadius: parseFloat(theme.radii.lg) * 16, // rem → dp
  padding: parseFloat(theme.spacing[4]) * 16,
}}>
  <Text style={{ color: theme.colors.foreground, fontSize: 16 }}>...</Text>
</View>
```

## 4. shadcn install plan (T-010 reference)

Komponenty, které T-010+ pravděpodobně potřebuje:

```
pnpm dlx shadcn@latest add button input label form
pnpm dlx shadcn@latest add card separator badge
pnpm dlx shadcn@latest add select tabs accordion
pnpm dlx shadcn@latest add dialog drawer sheet
pnpm dlx shadcn@latest add toast tooltip popover
pnpm dlx shadcn@latest add table
pnpm dlx shadcn@latest add dropdown-menu command
```

Po installu pak musí fullstack:

1. V každé shadcn komponentě nahradit jakékoli HEX color (které shadcn generuje) za naše CSS vars (`hsl(var(--primary))`).
2. Re-verify že `Button` má `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` (default je tam, jen sanity check).
3. Přidat `tabular-nums` class na všechny Table cells v `Table.tsx` (override šablony).
