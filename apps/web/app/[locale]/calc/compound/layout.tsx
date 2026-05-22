import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

const BASE_URL =
  process.env["NEXT_PUBLIC_SITE_URL"]?.replace(/\/$/, "") ??
  "https://investio.filiptomanec.cz";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "calc.compound" });

  // localePrefix: "as-needed" — CS served at /calc/compound (no prefix).
  // EN served at /en/calc/compound.
  const canonicalCs = `${BASE_URL}/calc/compound`;
  const canonicalEn = `${BASE_URL}/en/calc/compound`;
  const canonicalUrl = locale === "en" ? canonicalEn : canonicalCs;

  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        cs: canonicalCs,
        en: canonicalEn,
      },
    },
    openGraph: {
      title: t("title"),
      description: t("subtitle"),
      url: canonicalUrl,
    },
  };
}

export default function CompoundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
