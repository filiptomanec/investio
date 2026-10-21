import { Link } from "@tanstack/react-router";
import { MessageSquareWarning, Moon, Sparkles, Sun } from "lucide-react";
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

  const roundButton =
    "grid size-9 place-items-center rounded-full bg-(--b-track) text-(--b-muted) transition hover:text-(--b-ink) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--b-mint)";

  return (
    <div className="min-h-screen bg-(--b-bg) font-sans text-(--b-ink)">
      <header className="mx-auto grid max-w-7xl grid-cols-[1fr_auto] items-center gap-x-6 gap-y-3 px-4 pt-5 pb-4 md:grid-cols-[1fr_auto_1fr] md:px-8 md:pb-6">
        <Logo />

        <nav className="col-span-2 row-start-2 -mx-1 flex items-center gap-6 overflow-x-auto px-1 text-[15px] font-medium md:col-span-1 md:col-start-2 md:row-start-1">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: true }}
              className="relative whitespace-nowrap py-1 text-(--b-muted) transition-colors hover:text-(--b-ink) data-[status=active]:text-(--b-ink) data-[status=active]:after:absolute data-[status=active]:after:inset-x-0 data-[status=active]:after:-bottom-1 data-[status=active]:after:h-[3px] data-[status=active]:after:rounded-full data-[status=active]:after:bg-(--b-mint)"
            >
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center justify-end gap-2 md:col-start-3">
          <LanguageSwitcher />
          <button
            type="button"
            onClick={() => setWelcomeOpen(true)}
            aria-label={t("header.openWelcome")}
            title={t("header.openWelcome")}
            className={roundButton}
          >
            <Sparkles className="size-4" />
          </button>
          <button
            type="button"
            onClick={toggle}
            aria-label={t("header.toggleTheme")}
            title={t("header.toggleTheme")}
            className={roundButton}
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        </div>
      </header>

      {children}

      <footer className="mx-auto mt-14 max-w-7xl px-4 pb-10 md:px-8">
        <div className="flex flex-col gap-5 rounded-[28px] bg-(--b-card) p-6 text-[13px] leading-relaxed text-(--b-muted) shadow-(--b-shadow) md:flex-row md:items-start md:justify-between md:gap-12">
          <p className="max-w-2xl">
            {t("footer.methodologyShort", { year: new Date().getFullYear() })}
          </p>
          <div className="flex shrink-0 flex-col gap-2 md:items-end">
            <a
              href={feedbackMailto}
              className="inline-flex items-center gap-1.5 font-medium text-(--b-ink) transition-colors hover:text-(--b-mint-ink)"
            >
              <MessageSquareWarning className="size-3.5" />
              {t("footer.reportBug")}
            </a>
            <Link to="/privacy" className="transition-colors hover:text-(--b-ink)">
              {t("nav.privacy")}
            </Link>
          </div>
        </div>
      </footer>

      <WelcomeOverlay open={welcomeOpen} onClose={() => setWelcomeOpen(false)} />
    </div>
  );
}
