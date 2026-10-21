import { Link } from "@tanstack/react-router";
import { Moon, Sparkles, Sun } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Logo } from "@/components/logo";
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

  const iconButton =
    "size-9 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="min-h-screen bg-background font-sans text-foreground px-4 md:px-8">
      {/* No-sidebar shell: the bar sits on the page ground and shares the
          content column, so the logo and the title start on one edge. */}
      <header className="max-w-6xl mx-auto grid grid-cols-[1fr_auto] md:grid-cols-[auto_1fr_auto] items-center gap-x-8 gap-y-2 pt-4 pb-6 md:pt-5 md:pb-10">
        <Logo />

        <nav className="col-span-2 md:col-span-1 row-start-2 md:row-start-1 md:col-start-2 flex items-center gap-1 -mx-2.5 md:mx-0 overflow-x-auto text-[15px] font-medium">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: true }}
              className="px-2.5 py-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap data-[status=active]:text-foreground data-[status=active]:bg-muted"
            >
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 md:col-start-3">
          <LanguageSwitcher />
          <button
            type="button"
            onClick={() => setWelcomeOpen(true)}
            aria-label={t("header.openWelcome")}
            title={t("header.openWelcome")}
            className={iconButton}
          >
            <Sparkles className="size-4" />
          </button>
          <button
            type="button"
            onClick={toggle}
            aria-label={t("header.toggleTheme")}
            title={t("header.toggleTheme")}
            className={iconButton}
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        </div>
      </header>

      {children}

      <footer className="max-w-6xl mx-auto mt-16 md:mt-24 pt-6 pb-10 border-t border-border text-[13px] text-muted-foreground leading-relaxed">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-12">
          <p className="max-w-2xl">
            {t("footer.methodologyShort", { year: new Date().getFullYear() })}
          </p>
          <div className="flex flex-col gap-1.5 md:items-end shrink-0">
            <a href={feedbackMailto} className="text-foreground hover:underline underline-offset-4">
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
