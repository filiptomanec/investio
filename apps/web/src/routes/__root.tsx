import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { I18nextProvider, useTranslation } from "react-i18next";
import { useEffect } from "react";
import { i18n } from "@investio/i18n";
import { hideSplashScreen } from "@/lib/native";
import { Analytics } from "@vercel/analytics/react";

import "@/lib/sentry";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">{t("errors.notFoundTitle")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("errors.notFoundDescription")}</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("errors.notFoundBack")}
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {t("errors.loadFailedTitle")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("errors.loadFailedDescription")}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("errors.tryAgain")}
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {t("errors.goHome")}
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#f5f5f2", media: "(prefers-color-scheme: light)" },
      { name: "theme-color", content: "#141413", media: "(prefers-color-scheme: dark)" },
      { title: "Investio — Kalkulačka složeného úročení" },
      {
        name: "description",
        content:
          "Spočítejte budoucí hodnotu vašich investic, pasivní příjem a započtěte inflaci. Složené úročení s měsíční kapitalizací.",
      },
      { property: "og:title", content: "Investio — Kalkulačka složeného úročení" },
      {
        property: "og:description",
        content: "Spočítejte budoucí hodnotu vašich investic, pasivní příjem a započtěte inflaci.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        // Inline SVG favicon — eliminates the 404 console error from browsers
        // requesting /favicon.ico when no public/favicon.ico is present.
        rel: "icon",
        type: "image/svg+xml",
        href: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='7' fill='%231c1c1a'/><path d='M7 23.5 C 13 23, 18 21.5, 21.5 16.5 S 24.5 10, 25 8.5' fill='none' stroke='%2334b88a' stroke-width='2.6' stroke-linecap='round'/><circle cx='25' cy='8.5' r='2.6' fill='%23f5f5f2'/></svg>",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

// Synchronous pre-hydration script: applies the saved theme to <html> before the
// browser paints so dark/light mode never flickers on reload. Without a stored
// choice it follows the system setting.
const themeBootstrap = `(function(){try{var t=localStorage.getItem('investio-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark');}catch(e){}})();`;

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: the pre-hydration script mutates className to set
    // the dark/light class before React hydrates; lang is updated by useLanguageSync.
    // Both are intentional post-SSR mutations — suppress the mismatch warning.
    <html lang="cs" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>
        {children}
        <Scripts />
        <Analytics />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  // Hide the Capacitor splash screen once the React tree is mounted.
  // On web this is a no-op (see lib/native.ts).
  useEffect(() => {
    hideSplashScreen();
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
      </QueryClientProvider>
    </I18nextProvider>
  );
}
