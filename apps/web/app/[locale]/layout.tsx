import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import type { Locale } from "@investio/i18n";
import "../globals.css";

const BASE_URL = "https://investio.app";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  const csUrl = `${BASE_URL}/cs`;
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
    <html lang={locale} className="h-full antialiased">
      <body
        className="min-h-full flex flex-col"
        style={{
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Inter, 'Helvetica Neue', Arial, sans-serif",
        }}
      >
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
