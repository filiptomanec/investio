// Dashboard page — Server Component.
// Reads auth via requireUser (throws UnauthorizedError → middleware already
// redirected, but we guard here too). Fetches scenarios server-side via Prisma.

import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { TrendingUp, Home, ChartLine } from "lucide-react";

import { requireUser } from "@/lib/auth";
import { getPrismaForUser } from "@investio/db/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FilterChips } from "@/components/dashboard/filter-chips";
import { NewScenarioMenu } from "@/components/dashboard/new-scenario-menu";
import { ScenarioActions } from "@/components/dashboard/scenario-actions";
import { UnauthorizedError } from "@/lib/errors";
import { isSupabaseConfigured } from "@investio/auth/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FilterType = "all" | "compound" | "real_estate";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ type?: string }>;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelativeDate(date: Date, locale: string): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) {
    return locale === "cs" ? "před chvílí" : "just now";
  }
  if (diffHours < 24) {
    return locale === "cs" ? `před ${diffHours} h` : `${diffHours}h ago`;
  }
  if (diffDays === 1) {
    return locale === "cs" ? "včera" : "yesterday";
  }
  return date.toLocaleDateString(locale === "cs" ? "cs-CZ" : "en-GB", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function DashboardPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { type: typeParam } = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "dashboard" });
  const tEmpty = await getTranslations({ locale, namespace: "dashboard.empty" });
  const tTypes = await getTranslations({ locale, namespace: "dashboard.types" });

  // --- Backend not configured ---
  const configured = isSupabaseConfigured();

  // --- Auth ---
  let userId: string;
  try {
    const auth = await requireUser();
    userId = auth.userId;
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      redirect(`/${locale}/login`);
    }
    throw err;
  }

  // --- Filter ---
  const filter: FilterType =
    typeParam === "compound" || typeParam === "real_estate"
      ? typeParam
      : "all";

  // --- Fetch scenarios ---
  const db = getPrismaForUser(userId);
  const where: Record<string, unknown> = {
    user_id: userId,
    archived_at: null,
  };
  if (filter !== "all") {
    where["type"] = filter;
  }

  const scenarios = await db.scenario.findMany({
    where,
    orderBy: { updated_at: "desc" },
    take: 50,
  });

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <main className="min-h-screen bg-background">
      {/* Backend warning banner */}
      {!configured && (
        <div
          role="alert"
          className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-sm text-amber-800 text-center"
        >
          Backend není nakonfigurován — nastav NEXT_PUBLIC_SUPABASE_URL a NEXT_PUBLIC_SUPABASE_ANON_KEY.
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <NewScenarioMenu locale={locale} />
        </div>

        {/* Filter chips */}
        <div className="mb-6">
          <FilterChips current={filter} />
        </div>

        {/* Empty state */}
        {scenarios.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-6 border border-dashed border-border rounded-xl">
            <div className="p-4 rounded-full bg-muted">
              <ChartLine className="size-10 text-muted-foreground" aria-hidden />
            </div>
            <div className="space-y-2 max-w-xs">
              <p className="font-medium text-base">{tEmpty("title")}</p>
              <p className="text-sm text-muted-foreground">
                Vytvořte první kalkulačku nebo si projděte předpřipravené šablony.
              </p>
            </div>
            <div className="flex gap-3 flex-wrap justify-center">
              <a
                href={`/${locale}/calc/compound`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-transparent bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <TrendingUp className="size-4" aria-hidden />
                {tEmpty("compoundCta")}
              </a>
              <a
                href={`/${locale}/calc/real-estate`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Home className="size-4" aria-hidden />
                {tEmpty("realEstateCta")}
              </a>
            </div>
          </div>
        )}

        {/* Scenario grid */}
        {scenarios.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scenarios.map((scenario) => {
              const isCompound = scenario.type === "compound";
              const calcPath = isCompound
                ? `/${locale}/calc/compound?scenario=${scenario.id}`
                : `/${locale}/calc/real-estate?scenario=${scenario.id}`;

              return (
                <Card key={scenario.id} className="relative">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {/* Type badge */}
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                            isCompound
                              ? "bg-teal-100 text-teal-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                          aria-label={
                            isCompound
                              ? tTypes("compound")
                              : tTypes("realEstate")
                          }
                        >
                          {isCompound ? (
                            <TrendingUp className="size-3" aria-hidden />
                          ) : (
                            <Home className="size-3" aria-hidden />
                          )}
                          <span>
                            {isCompound
                              ? tTypes("compound")
                              : tTypes("realEstate")}
                          </span>
                        </span>
                      </div>

                      {/* Actions menu */}
                      <ScenarioActions
                        scenarioId={scenario.id}
                        scenarioName={scenario.name}
                        scenarioType={scenario.type as "compound" | "real_estate"}
                        locale={locale}
                      />
                    </div>

                    {/* Scenario name */}
                    <a
                      href={calcPath}
                      className="block font-medium text-foreground hover:text-primary transition-colors mt-1 truncate"
                      title={scenario.name}
                    >
                      {scenario.name}
                    </a>
                  </CardHeader>

                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeDate(scenario.updated_at, locale)}
                      </span>
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">
                        {scenario.currency}
                      </span>
                    </div>

                    {/* Primary action */}
                    <a
                      href={calcPath}
                      className="mt-3 block w-full rounded-lg bg-primary px-3 py-1.5 text-center text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {t("actions.open")}
                    </a>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
