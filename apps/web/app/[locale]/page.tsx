import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function LocalePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <LocalePageContent />;
}

// Client component to use useTranslations hook
function LocalePageContent() {
  const t = useTranslations("common");
  return (
    <main className="flex flex-1 flex-col items-center justify-center min-h-screen bg-background text-foreground">
      {t("appName")} scaffold ready
    </main>
  );
}
