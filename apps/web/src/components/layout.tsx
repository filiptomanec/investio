import { Link } from "@tanstack/react-router";
import { Moon, Sun } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useLanguageSync } from "@/hooks/use-language-sync";
import { useTheme } from "@/hooks/use-theme";

const navItems = [
  { to: "/", labelKey: "nav.basic" },
  { to: "/advanced", labelKey: "nav.advanced" },
  { to: "/renta", labelKey: "nav.renta" },
] as const;

export function Layout({ children }: { children: ReactNode }) {
  useLanguageSync();
  const { t } = useTranslation();
  const { theme, toggle } = useTheme();

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
            onClick={toggle}
            aria-label={t("header.toggleTheme")}
            className="size-9 inline-flex items-center justify-center rounded-lg border border-border bg-card hover:bg-muted transition-colors text-foreground"
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        </div>
      </header>

      {children}

      <footer className="max-w-6xl mx-auto mt-12 text-muted-foreground text-xs py-8 border-t border-border leading-relaxed text-center">
        <p className="max-w-3xl mx-auto">
          {t("footer.methodologyShort", { year: new Date().getFullYear() })}
        </p>
        <p className="mt-3">
          <Link
            to="/privacy"
            className="hover:text-brand transition-colors underline underline-offset-2"
          >
            {t("nav.privacy")}
          </Link>
        </p>
      </footer>
    </div>
  );
}
