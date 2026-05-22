import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { routing } from "@/i18n/routing";
import type { Locale } from "@investio/i18n";
import "../globals.css";

// Load Geist once at module level — next/font deduplicates across layouts.
const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

// NEXT_PUBLIC_SITE_URL must be set in Vercel (e.g. https://investio.filiptomanec.cz).
// Falls back to investio.app for backwards compatibility on domains not yet migrated.
const BASE_URL =
  process.env["NEXT_PUBLIC_SITE_URL"]?.replace(/\/$/, "") ??
  "https://investio.filiptomanec.cz";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  // localePrefix: "as-needed" — CS (default) is served WITHOUT /cs prefix.
  // Canonicals must point at the actually-served URL to avoid LH "canonical
  // points to hreflang" mismatch. EN is always at /en.
  // hreflang alternates also use the same un-prefixed CS URL.
  const csUrl = BASE_URL; // CS root = https://investio.filiptomanec.cz
  const enUrl = `${BASE_URL}/en`;
  const canonicalUrl = locale === "en" ? enUrl : csUrl;
  const ogImageUrl = `${BASE_URL}/${locale}/opengraph-image`;

  return {
    title: t("title"),
    description: t("description"),
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        cs: csUrl,
        en: enUrl,
      },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: canonicalUrl,
      siteName: "Investio",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: t("title"),
        },
      ],
      type: "website",
      locale: locale === "en" ? "en_US" : "cs_CZ",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: [ogImageUrl],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  // Enable static rendering for this locale
  setRequestLocale(locale);

  return (
    <html lang={locale} className={cn("h-full antialiased font-sans", geist.variable)}>
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
