import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { Calculator, GitCompare, BookOpen } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function LocalePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <LandingPage />;
}

// -----------------------------------------------------------------------
// JSON-LD structured data — WebApplication + Organization
// -----------------------------------------------------------------------
function StructuredData() {
  const baseUrl = "https://investio.app";
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Investio",
      description:
        "Kalkulačka pro porovnání složeného úročení akcií a cashflow z nemovitosti. Calculator for comparing compound interest from stocks with rental property cashflow.",
      url: baseUrl,
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "CZK",
      },
      inLanguage: ["cs", "en"],
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Investio",
      url: baseUrl,
      description:
        "Edukační investiční kalkulačka pro českou retail investorskou komunitu.",
    },
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

// -----------------------------------------------------------------------
// Hero geometric pattern — pure CSS, no external images
// -----------------------------------------------------------------------
function HeroPattern() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 60% 40%, hsl(174 80% 26% / 0.08) 0%, transparent 70%), " +
          "radial-gradient(ellipse 50% 40% at 80% 80%, hsl(38 92% 50% / 0.06) 0%, transparent 60%)",
      }}
    >
      {/* Geometric dots grid */}
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="hero-dots"
            x="0"
            y="0"
            width="32"
            height="32"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1" cy="1" r="1" fill="hsl(174 80% 26% / 0.15)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-dots)" />
      </svg>
    </div>
  );
}

// -----------------------------------------------------------------------
// Feature card
// -----------------------------------------------------------------------
type FeatureCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
};

function FeatureCard({
  icon,
  title,
  description,
  ctaLabel,
  ctaHref,
}: FeatureCardProps) {
  return (
    <Card className="flex flex-col h-full" data-testid="feature-card">
      <CardHeader>
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        <CardDescription className="text-sm leading-relaxed">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1" />
      <CardFooter>
        <Link
          href={ctaHref}
          className="text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {ctaLabel} →
        </Link>
      </CardFooter>
    </Card>
  );
}

// -----------------------------------------------------------------------
// Landing page content — server component, no client interactivity
// -----------------------------------------------------------------------
function LandingPage() {
  const t = useTranslations("landing");
  const tCommon = useTranslations("common");

  return (
    <>
      <StructuredData />

      {/* Skip to main content */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>

      {/* ── Navigation ───────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-14 max-w-screen-xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold text-foreground"
            aria-label={tCommon("appName")}
          >
            {/* Brand mark — teal square */}
            <span
              aria-hidden="true"
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold"
            >
              I
            </span>
            <span className="text-sm font-semibold">{tCommon("appName")}</span>
          </Link>
          <nav
            className="hidden gap-6 sm:flex items-center"
            aria-label="Main navigation"
          >
            <Link
              href="/cs/compare"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("features.templates.cta")}
            </Link>
            <Link
              href="/cs/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {tCommon("appName") === "Investio" ? "Přihlásit" : "Sign in"}
            </Link>
            <Link
              href="/cs/signup"
              className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {t("cta.button")}
            </Link>
          </nav>
        </div>
      </header>

      <main id="main" className="flex-1">
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section
          className="relative overflow-hidden bg-background py-20 sm:py-28 lg:py-36"
          aria-labelledby="hero-heading"
        >
          <HeroPattern />
          <div className="relative mx-auto max-w-screen-xl px-4 sm:px-6 text-center">
            {/* Amber accent badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full bg-amber-500"
              />
              CZ + EN · Zdarma · Open source
            </div>

            <h1
              id="hero-heading"
              className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl"
              style={{ lineHeight: 1.1, letterSpacing: "-0.02em" }}
            >
              {t("hero.title")}
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground leading-relaxed">
              {t("hero.subtitle")}
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/cs/calc/compound"
                className="inline-flex w-full sm:w-auto h-11 items-center justify-center rounded-lg bg-primary px-8 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {t("hero.ctaPrimary")}
              </Link>
              <Link
                href="/cs/compare"
                className="inline-flex w-full sm:w-auto h-11 items-center justify-center rounded-lg border border-border bg-background px-8 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {t("hero.ctaSecondary")}
              </Link>
            </div>

            <p className="mt-5 text-xs text-muted-foreground">
              Žádná registrace pro vyzkoušení. Žádný trading bias.
            </p>
          </div>
        </section>

        {/* ── Features ─────────────────────────────────────────────────────── */}
        <section
          className="bg-muted/30 py-20 sm:py-24"
          aria-labelledby="features-heading"
        >
          <div className="mx-auto max-w-screen-xl px-4 sm:px-6">
            <h2
              id="features-heading"
              className="mb-12 text-center text-2xl font-semibold text-foreground sm:text-3xl"
            >
              Všechno, co potřebuješ k rozhodnutí
            </h2>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <FeatureCard
                icon={<Calculator size={20} aria-hidden="true" />}
                title={t("features.calculators.title")}
                description={t("features.calculators.description")}
                ctaLabel={t("features.calculators.cta")}
                ctaHref="/cs/calc/compound"
              />
              <FeatureCard
                icon={<GitCompare size={20} aria-hidden="true" />}
                title={t("features.compare.title")}
                description={t("features.compare.description")}
                ctaLabel={t("features.compare.cta")}
                ctaHref="/cs/dashboard"
              />
              <FeatureCard
                icon={<BookOpen size={20} aria-hidden="true" />}
                title={t("features.templates.title")}
                description={t("features.templates.description")}
                ctaLabel={t("features.templates.cta")}
                ctaHref="/cs/compare"
              />
            </div>
          </div>
        </section>

        {/* ── CTA strip ────────────────────────────────────────────────────── */}
        <section
          className="bg-primary py-16 sm:py-20"
          aria-labelledby="cta-heading"
        >
          <div className="mx-auto max-w-screen-xl px-4 sm:px-6 text-center">
            {/* Amber accent stripe */}
            <div
              aria-hidden="true"
              className="mx-auto mb-6 h-1 w-16 rounded-full bg-amber-400"
            />
            <h2
              id="cta-heading"
              className="text-2xl font-bold text-primary-foreground sm:text-3xl"
            >
              {t("cta.title")}
            </h2>
            <p className="mt-3 text-primary-foreground/80 text-base max-w-md mx-auto">
              {t("cta.subtitle")}
            </p>
            <div className="mt-8">
              <Link
                href="/cs/signup"
                className="inline-flex h-11 items-center justify-center rounded-lg bg-white px-10 text-sm font-semibold text-primary transition-colors hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                {t("cta.button")}
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-background py-8">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
            <p className="text-xs text-muted-foreground max-w-md">
              {t("footer.disclaimer")}
            </p>
            <nav
              className="flex items-center gap-4 text-xs text-muted-foreground"
              aria-label="Footer navigation"
            >
              <a
                href="https://github.com/filiptomanec/investio"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                {t("footer.github")}
              </a>
              <span aria-hidden="true">·</span>
              <Link href="/cs/privacy" className="hover:text-foreground transition-colors">
                {t("footer.privacy")}
              </Link>
              <span aria-hidden="true">·</span>
              <span>© 2026 Investio</span>
            </nav>
          </div>
        </div>
      </footer>
    </>
  );
}
