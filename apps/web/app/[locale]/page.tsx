import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { Calculator, GitCompare, BookOpen, ArrowRight, Sparkles, TrendingUp } from "lucide-react";
import { LiveCounter } from "@/components/landing/LiveCounter";
import { HeroChartAnchor } from "@/components/landing/HeroChartAnchor";

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
// Feature card — bolder treatment with accent icon halo and lift on hover
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
    <Link
      href={ctaHref}
      data-testid="feature-card"
      className="group relative flex h-full flex-col gap-5 overflow-hidden rounded-3xl border border-primary/10 bg-card p-7 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 motion-safe:hover:shadow-[0_0_60px_-15px_hsl(174_80%_36%/0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {/* Inner top-left accent glow — premium feel per references */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-12 -top-12 size-40 rounded-full bg-primary/[0.07] blur-2xl transition-opacity duration-300 group-hover:bg-primary/[0.15]"
      />

      {/* Icon with halo */}
      <div className="relative">
        <div
          aria-hidden="true"
          className="absolute -inset-2 rounded-full bg-primary/15 blur-md transition-opacity duration-300 group-hover:bg-primary/30"
        />
        <div className="relative flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
          {icon}
        </div>
      </div>

      <div className="relative space-y-2">
        <h3 className="text-xl font-bold tracking-tight text-foreground">
          {title}
        </h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>

      <div className="relative mt-auto flex items-center gap-1.5 text-sm font-semibold text-primary">
        <span>{ctaLabel}</span>
        <ArrowRight
          aria-hidden="true"
          className="size-4 transition-transform duration-300 motion-safe:group-hover:translate-x-1"
        />
      </div>
    </Link>
  );
}

// -----------------------------------------------------------------------
// Landing page content — server component, no client interactivity except
// the LiveCounter island below the fold.
// -----------------------------------------------------------------------
function LandingPage() {
  const t = useTranslations("landing");
  const tCommon = useTranslations("common");

  // Split the hero title so the last word can carry the gradient treatment.
  const heroTitle = t("hero.title");
  const lastSpace = heroTitle.lastIndexOf(" ");
  const titleHead = lastSpace > 0 ? heroTitle.slice(0, lastSpace) : heroTitle;
  const titleTail = lastSpace > 0 ? heroTitle.slice(lastSpace + 1) : "";

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
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-screen-xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-semibold text-foreground"
            aria-label={tCommon("appName")}
          >
            {/* Brand mark — teal square with glow */}
            <span
              aria-hidden="true"
              className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground text-sm font-black ring-1 ring-primary/40 glow-accent-sm"
            >
              I
            </span>
            <span className="text-base font-bold tracking-tight">
              {tCommon("appName")}
            </span>
          </Link>
          <nav
            className="hidden gap-7 sm:flex items-center"
            aria-label="Main navigation"
          >
            <Link
              href="/cs/compare"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("features.templates.cta")}
            </Link>
            <Link
              href="/cs/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {tCommon("appName") === "Investio" ? "Přihlásit" : "Sign in"}
            </Link>
            <Link
              href="/cs/signup"
              className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-all motion-safe:hover:scale-[1.03] hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {t("cta.button")}
            </Link>
          </nav>
        </div>
      </header>

      <main id="main" className="flex-1">
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section
          className="relative overflow-hidden bg-background"
          aria-labelledby="hero-heading"
        >
          {/* Layered atmosphere: teal halo + noise grain */}
          <div aria-hidden="true" className="absolute inset-0 bg-halo-teal pointer-events-none" />
          <div aria-hidden="true" className="absolute inset-0 bg-noise pointer-events-none mix-blend-overlay" />

          <div className="relative mx-auto grid max-w-screen-xl gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-12 lg:gap-8 lg:py-28">
            {/* Left: copy + CTAs */}
            <div className="lg:col-span-7 flex flex-col items-start text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles size={12} aria-hidden="true" />
                <span>CZ + EN · Zdarma · Open source</span>
              </div>

              <h1
                id="hero-heading"
                className="mt-6 max-w-3xl text-display text-foreground"
              >
                {titleHead}
                {titleTail && (
                  <>
                    {" "}
                    <span className="text-gradient-teal">{titleTail}</span>
                  </>
                )}
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
                {t("hero.subtitle")}
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/cs/calc/compound"
                  className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground transition-all glow-accent motion-safe:hover:scale-[1.03] hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-auto"
                >
                  {t("hero.ctaPrimary")}
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 transition-transform motion-safe:group-hover:translate-x-0.5"
                  />
                </Link>
                <Link
                  href="/cs/compare"
                  className="inline-flex h-12 w-full items-center justify-center rounded-full border border-primary/40 bg-background/60 px-7 text-sm font-semibold text-foreground backdrop-blur transition-all motion-safe:hover:scale-[1.03] hover:border-primary/70 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-auto"
                >
                  {t("hero.ctaSecondary")}
                </Link>
              </div>

              <p className="mt-5 text-xs font-medium text-muted-foreground">
                Žádná registrace pro vyzkoušení. Žádný trading bias.
              </p>
            </div>

            {/* Right: hero visual anchor — animated dual line chart */}
            <div className="lg:col-span-5 relative">
              <HeroChartAnchor />
            </div>
          </div>

          {/* Animated stat strip below the fold */}
          <div className="relative border-t border-border/60 bg-card/30 backdrop-blur-sm">
            <div className="mx-auto flex max-w-screen-xl flex-col items-center gap-6 px-4 py-8 sm:flex-row sm:justify-around sm:px-6">
              <div className="flex items-center gap-3">
                <div
                  aria-hidden="true"
                  className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20"
                >
                  <TrendingUp size={18} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Porovnáno scénářů
                  </p>
                  <p className="text-2xl font-black text-foreground text-finance">
                    <LiveCounter target={12847} />
                  </p>
                </div>
              </div>

              <div className="hidden h-10 w-px bg-border sm:block" aria-hidden="true" />

              <div className="flex items-center gap-3">
                <div
                  aria-hidden="true"
                  className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20"
                >
                  <Calculator size={18} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    3 kalkulačky
                  </p>
                  <p className="text-2xl font-black text-foreground text-finance">
                    Akcie · Nemovitost · Porovnání
                  </p>
                </div>
              </div>

              <div className="hidden h-10 w-px bg-border sm:block" aria-hidden="true" />

              <div className="flex items-center gap-3">
                <div
                  aria-hidden="true"
                  className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20"
                >
                  <Sparkles size={18} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Open source · MIT
                  </p>
                  <p className="text-2xl font-black text-foreground text-finance">
                    Zdarma navždy
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Features ─────────────────────────────────────────────────────── */}
        <section
          className="relative overflow-hidden bg-muted/30 py-24 sm:py-28"
          aria-labelledby="features-heading"
        >
          <div aria-hidden="true" className="absolute inset-0 bg-halo-teal-bottom-left pointer-events-none" />

          <div className="relative mx-auto max-w-screen-xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                Vše v jednom nástroji
              </p>
              <h2
                id="features-heading"
                className="mt-4 text-display-lg text-foreground"
              >
                Spočítej. Porovnej. Rozhodni.
              </h2>
              <p className="mt-5 text-lg text-muted-foreground">
                Tři kalkulačky, jeden cíl — vidět svá čísla jasně, než nalijete
                peníze do akcií nebo do bytu.
              </p>
            </div>

            <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
              <FeatureCard
                icon={<Calculator size={22} aria-hidden="true" />}
                title={t("features.calculators.title")}
                description={t("features.calculators.description")}
                ctaLabel={t("features.calculators.cta")}
                ctaHref="/cs/calc/compound"
              />
              <FeatureCard
                icon={<GitCompare size={22} aria-hidden="true" />}
                title={t("features.compare.title")}
                description={t("features.compare.description")}
                ctaLabel={t("features.compare.cta")}
                ctaHref="/cs/dashboard"
              />
              <FeatureCard
                icon={<BookOpen size={22} aria-hidden="true" />}
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
          className="relative overflow-hidden"
          aria-labelledby="cta-heading"
        >
          {/* Layered teal gradient + grain texture */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, hsl(174 80% 18%) 0%, hsl(174 80% 26%) 50%, hsl(174 80% 16%) 100%)",
            }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-noise pointer-events-none mix-blend-overlay"
          />
          {/* Inner glow halos */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-32 top-1/2 size-96 -translate-y-1/2 rounded-full bg-white/10 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-32 bottom-0 size-72 rounded-full bg-white/[0.07] blur-3xl"
          />

          <div className="relative mx-auto max-w-screen-xl px-4 py-24 text-center sm:px-6 sm:py-32">
            {/* Tiny pill badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
              <span
                aria-hidden="true"
                className="size-1.5 rounded-full bg-amber-300"
              />
              Začni hned
            </div>
            <h2
              id="cta-heading"
              className="mx-auto max-w-2xl text-display-lg text-white"
            >
              {t("cta.title")}
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/80">
              {t("cta.subtitle")}
            </p>
            <div className="mt-10">
              <Link
                href="/cs/signup"
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-8 text-sm font-bold text-primary transition-all motion-safe:hover:scale-[1.03] hover:bg-white/95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
              >
                {t("cta.button")}
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 transition-transform motion-safe:group-hover:translate-x-0.5"
                />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-background">
        {/* Top accent line */}
        <div
          aria-hidden="true"
          className="h-px w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent"
        />
        <div className="mx-auto max-w-screen-xl px-4 py-10 sm:px-6">
          <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:justify-between sm:text-left">
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-black"
              >
                I
              </span>
              <p className="max-w-md text-xs text-muted-foreground">
                {t("footer.disclaimer")}
              </p>
            </div>
            <nav
              className="flex items-center gap-4 text-xs font-medium text-muted-foreground"
              aria-label="Footer navigation"
            >
              <a
                href="https://github.com/filiptomanec/investio"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-foreground"
              >
                {t("footer.github")}
              </a>
              <span aria-hidden="true">·</span>
              <Link
                href="/cs/privacy"
                className="transition-colors hover:text-foreground"
              >
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
