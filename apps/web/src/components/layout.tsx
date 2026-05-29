import { Link } from "@tanstack/react-router";
import { MessageSquareWarning, Moon, Sparkles, Sun } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/language-switcher";
import { WelcomeOverlay } from "@/components/welcome-overlay";
import { useLanguageSync } from "@/hooks/use-language-sync";
import { useTheme } from "@/hooks/use-theme";

const navItems = [
  { to: "/", labelKey: "nav.investice" },
  { to: "/renta", labelKey: "nav.renta" },
  { to: "/hypoteka", labelKey: "nav.hypoteka" },
] as const;

const FEEDBACK_EMAIL = "support@filiptomanec.cz";

export function Layout({ children }: { children: ReactNode }) {
  useLanguageSync();
  const { t } = useTranslation();
  const { theme, toggle } = useTheme();
  const [welcomeOpen, setWelcomeOpen] = useState(false);

  useEffect(() => {
    try {
      const hidden = localStorage.getItem("investio-welcome-hidden") === "1";
      if (!hidden) setWelcomeOpen(true);
    } catch {
      setWelcomeOpen(true);
    }
  }, []);

  const feedbackBody = [
    t("feedback.bodyIntro"),
    "",
    t("feedback.bodyChoices"),
    "",
    t("feedback.bodyDescription"),
    "",
    t("feedback.bodyWhere"),
    "",
    t("feedback.bodyDevice"),
    "",
    t("feedback.bodyThanks"),
  ].join("\n");
  const feedbackMailto = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(
    t("feedback.subject"),
  )}&body=${encodeURIComponent(feedbackBody)}`;

  return (
    <div className="min-h-screen bg-background font-sans text-foreground p-4 md:p-8">
      <header className="max-w-6xl mx-auto flex justify-between items-center gap-4 mb-8 flex-wrap">
        <Link to="/" className="flex items-center gap-2">
          <div className="size-8 bg-brand rounded-lg flex items-center justify-center">
            <div className="size-4 bg-background rounded-sm rotate-45"></div>
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">
            INVEST<span className="text-brand">IO</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 text-sm font-medium order-3 md:order-2 w-full md:w-auto overflow-x-auto">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: true }}
              className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors whitespace-nowrap data-[status=active]:bg-brand/10 data-[status=active]:text-brand"
            >
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 order-2 md:order-3">
          <LanguageSwitcher />
          <button
            type="button"
            onClick={() => setWelcomeOpen(true)}
            aria-label={t("header.openWelcome")}
            className="size-9 inline-flex items-center justify-center rounded-lg border border-border bg-card hover:bg-muted transition-colors text-foreground"
          >
            <Sparkles className="size-4" />
          </button>
          <button
            type="button"
            onClick={toggle}
            aria-label={t("header.toggleTheme")}
            className="size-9 inline-flex items-center justify-center rounded-lg border border-border bg-card hover:bg-muted transition-colors text-foreground"
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        </div>
      </header>

      {children}

      <footer className="max-w-6xl mx-auto mt-12 text-muted-foreground text-xs py-8 border-t border-border leading-relaxed">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <p className="max-w-2xl">
            {t("footer.methodologyShort", { year: new Date().getFullYear() })}
          </p>
          <div className="flex flex-col gap-2 md:items-end">
            <a
              href={feedbackMailto}
              className="inline-flex items-center gap-1.5 text-foreground hover:text-brand transition-colors font-medium"
            >
              <MessageSquareWarning className="size-3.5" />
              {t("footer.reportBug")}
            </a>
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              {t("nav.privacy")}
            </Link>
          </div>
        </div>
      </footer>

      <WelcomeOverlay open={welcomeOpen} onClose={() => setWelcomeOpen(false)} />
    </div>
  );
}
