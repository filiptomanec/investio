import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  Calculator,
  TrendingUp,
  Home as HomeIcon,
  Sparkles,
  X,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { DeviceMockup } from "@/components/device-mockup";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

import basicDesktop from "@/assets/screenshots/basic-desktop.png";
import basicMobile from "@/assets/screenshots/basic-mobile.png";
import rentaDesktop from "@/assets/screenshots/renta-desktop.png";
import rentaMobile from "@/assets/screenshots/renta-mobile.png";
import hypotekaDesktop from "@/assets/screenshots/hypoteka-desktop.png";
import hypotekaMobile from "@/assets/screenshots/hypoteka-mobile.png";

const STORAGE_KEY = "investio-welcome-hidden";

type SlideDef = {
  key: "investice" | "renta" | "hypoteka";
  icon: LucideIcon;
  to: "/" | "/renta" | "/hypoteka";
  desktop: string;
  mobile: string;
  gradient: string;
};

const slidesDef: SlideDef[] = [
  {
    key: "investice",
    icon: Calculator,
    to: "/",
    desktop: basicDesktop,
    mobile: basicMobile,
    gradient: "from-emerald-500/40 via-teal-500/20 to-transparent",
  },
  {
    key: "renta",
    icon: TrendingUp,
    to: "/renta",
    desktop: rentaDesktop,
    mobile: rentaMobile,
    gradient: "from-violet-500/40 via-fuchsia-500/20 to-transparent",
  },
  {
    key: "hypoteka",
    icon: HomeIcon,
    to: "/hypoteka",
    desktop: hypotekaDesktop,
    mobile: hypotekaMobile,
    gradient: "from-amber-500/40 via-orange-500/20 to-transparent",
  },
];

type Props = {
  open: boolean;
  onClose: () => void;
};

export function WelcomeOverlay({ open, onClose }: Props) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [dontShow, setDontShow] = useState(true);
  const [api, setApi] = useState<CarouselApi | null>(null);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on("select", onSelect);
    api.on("reInit", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  function close() {
    if (dontShow) {
      try {
        localStorage.setItem(STORAGE_KEY, "1");
      } catch {
        // ignore
      }
    }
    onClose();
  }

  if (!open) return null;

  const body = (
    <Shell
      isMobile={isMobile}
      api={api}
      setApi={setApi}
      current={current}
      dontShow={dontShow}
      setDontShow={setDontShow}
      onClose={close}
    />
  );

  if (isMobile) {
    return (
      <Drawer
        open={open}
        onOpenChange={(o) => {
          if (!o) close();
        }}
        shouldScaleBackground={false}
      >
        <DrawerContent className="h-[96dvh] bg-card border-border p-0 focus:outline-none">
          <DrawerTitle className="sr-only">{t("welcome.drawerTitle")}</DrawerTitle>
          <div className="flex-1 min-h-0 flex flex-col">{body}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/85 backdrop-blur-md animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
    >
      <div className="relative w-full max-w-6xl max-h-[95vh] h-[760px] overflow-hidden bg-card border border-border rounded-3xl shadow-2xl flex flex-col">
        {body}
      </div>
    </div>
  );
}

function Shell({
  isMobile,
  api,
  setApi,
  current,
  dontShow,
  setDontShow,
  onClose,
}: {
  isMobile: boolean;
  api: CarouselApi | null;
  setApi: (a: CarouselApi) => void;
  current: number;
  dontShow: boolean;
  setDontShow: (v: boolean) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  return (
    <>
      <button
        type="button"
        onClick={onClose}
        aria-label={t("welcome.close")}
        className="absolute top-2 right-2 sm:top-3 sm:right-3 z-20 size-9 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <X className="size-4" />
      </button>

      <div className="px-4 sm:px-10 pt-4 sm:pt-8 pb-2 sm:pb-4 flex-shrink-0">
        <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] uppercase tracking-wider text-brand bg-brand/10 border border-brand/30 rounded-full px-2 py-0.5 sm:py-1 mb-1.5 sm:mb-3">
          <Sparkles className="size-3" />
          {t("welcome.kicker")}
        </div>
        <h2
          id="welcome-title"
          className="text-lg sm:text-3xl font-bold tracking-tight text-foreground leading-tight"
        >
          {t("welcome.title")} <span className="text-brand">{t("welcome.titleHighlight")}</span>
        </h2>
      </div>

      <div className="relative flex-1 min-h-0 px-2 sm:px-0">
        <Carousel
          opts={{ align: "center", loop: true }}
          setApi={setApi}
          className="w-full h-full [&>div]:h-full"
        >
          <CarouselContent className="-ml-3 h-full">
            {slidesDef.map((slide) => (
              <CarouselItem
                key={slide.key}
                className={cn(
                  "pl-3 h-full",
                  isMobile ? "basis-full" : "basis-[80%] md:basis-[78%]",
                )}
              >
                <SlideCard slide={slide} onCta={onClose} isMobile={isMobile} />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      <div className="px-3 sm:px-10 py-2 sm:py-3 flex items-center justify-between gap-2 sm:gap-3 flex-shrink-0">
        <button
          type="button"
          onClick={() => api?.scrollPrev()}
          aria-label={t("welcome.prev")}
          className="size-9 inline-flex items-center justify-center rounded-lg border border-border bg-surface hover:bg-muted text-foreground transition-colors flex-shrink-0"
        >
          <ChevronLeft className="size-4" />
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {slidesDef.map((s, i) => (
            <button
              key={s.key}
              type="button"
              onClick={() => api?.scrollTo(i)}
              aria-label={t("welcome.slideAria", { n: i + 1 })}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === current
                  ? "w-6 sm:w-8 bg-brand"
                  : "w-1.5 bg-border hover:bg-muted-foreground/40",
              )}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => api?.scrollNext()}
          aria-label={t("welcome.next")}
          className="size-9 inline-flex items-center justify-center rounded-lg border border-border bg-surface hover:bg-muted text-foreground transition-colors flex-shrink-0"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="px-3 sm:px-10 py-3 sm:py-4 border-t border-border flex items-center justify-between gap-3 flex-shrink-0">
        <label className="flex items-center gap-2 text-[11px] sm:text-xs text-muted-foreground cursor-pointer select-none">
          <input
            type="checkbox"
            checked={dontShow}
            onChange={(e) => setDontShow(e.target.checked)}
            className="size-4 rounded border-border accent-brand"
          />
          {t("welcome.dontShow")}
        </label>
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-semibold px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-brand text-primary-foreground hover:bg-brand-dark transition-colors whitespace-nowrap"
        >
          {t("welcome.start")}
        </button>
      </div>
    </>
  );
}

function SlideCard({
  slide,
  onCta,
  isMobile,
}: {
  slide: SlideDef;
  onCta: () => void;
  isMobile: boolean;
}) {
  const { t } = useTranslation();
  const Icon = slide.icon;
  const base = `welcome.slides.${slide.key}`;
  const bullets = [t(`${base}.bullet1`), t(`${base}.bullet2`), t(`${base}.bullet3`)];

  return (
    <div className="relative h-full rounded-2xl border border-border bg-surface overflow-hidden">
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br pointer-events-none opacity-90",
          slide.gradient,
        )}
      />
      <div className="absolute -top-24 -right-24 size-72 rounded-full bg-brand/15 blur-3xl pointer-events-none" />

      <div
        className={cn(
          "relative h-full grid gap-4 sm:gap-6 md:gap-8 p-4 sm:p-6 md:p-8",
          isMobile ? "grid-rows-[auto_1fr]" : "grid-cols-2",
        )}
      >
        <div className="flex flex-col justify-center min-w-0">
          <div className="inline-flex w-fit items-center gap-1.5 text-[10px] uppercase tracking-wider text-brand bg-brand/10 border border-brand/30 rounded-full px-2 py-0.5 mb-2 sm:mb-3">
            <Icon className="size-3" />
            {t(`${base}.kicker`)}
          </div>
          <h3 className="text-xl sm:text-2xl md:text-4xl font-bold tracking-tight text-foreground leading-tight">
            {t(`${base}.title`)} <span className="text-brand">{t(`${base}.highlight`)}</span>
          </h3>
          <p className="mt-2 sm:mt-3 text-sm md:text-base text-muted-foreground leading-relaxed max-w-md">
            {t(`${base}.description`)}
          </p>
          <ul className="mt-3 sm:mt-4 space-y-1.5">
            {bullets.map((b) => (
              <li key={b} className="flex items-center gap-2 text-xs sm:text-sm text-foreground/85">
                <span className="size-1.5 rounded-full bg-brand flex-shrink-0" />
                {b}
              </li>
            ))}
          </ul>
          <div className="mt-3 sm:mt-5">
            <Link
              to={slide.to}
              onClick={onCta}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-4 py-2 sm:py-2.5 rounded-xl bg-brand text-primary-foreground hover:bg-brand-dark transition-colors w-fit"
            >
              {t(`${base}.cta`)}
              <ChevronRight className="size-3.5" />
            </Link>
          </div>
        </div>

        {isMobile ? (
          <div className="relative min-h-0 flex items-center justify-center [perspective:1200px]">
            <DeviceMockup
              variant="mobile"
              src={slide.mobile}
              alt={t(`${base}.altMobile`)}
              className="h-full max-h-full w-auto aspect-[9/19] max-w-[60%] [&_img]:h-full [&_img]:w-auto [&_img]:object-contain [&>div:last-child]:h-full [&>div:last-child]:flex [&>div:last-child]:items-center [&>div:last-child]:justify-center"
              style={{
                transform: "rotateY(-8deg) rotateX(4deg) rotateZ(2deg)",
              }}
            />
          </div>
        ) : (
          <div className="relative [perspective:1400px]">
            <DeviceMockup
              variant="desktop"
              src={slide.desktop}
              alt={t(`${base}.altDesktop`)}
              className="absolute top-2 left-0 w-[78%]"
              style={{
                transform: "rotateY(-14deg) rotateX(6deg) rotateZ(-1deg)",
                transformOrigin: "center center",
              }}
            />
            <DeviceMockup
              variant="mobile"
              src={slide.mobile}
              alt={t(`${base}.altMobile`)}
              className="absolute bottom-0 right-2 w-[34%]"
              style={{
                transform: "rotateY(-10deg) rotateX(4deg) rotateZ(3deg)",
                transformOrigin: "center center",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
