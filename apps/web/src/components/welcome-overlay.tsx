import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
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
  to: "/" | "/renta" | "/hypoteka";
  desktop: string;
  mobile: string;
};

const slidesDef: SlideDef[] = [
  {
    key: "investice",
    to: "/",
    desktop: basicDesktop,
    mobile: basicMobile,
  },
  {
    key: "renta",
    to: "/renta",
    desktop: rentaDesktop,
    mobile: rentaMobile,
  },
  {
    key: "hypoteka",
    to: "/hypoteka",
    desktop: hypotekaDesktop,
    mobile: hypotekaMobile,
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
    >
      <div className="relative w-full max-w-6xl max-h-[95vh] h-[760px] overflow-hidden bg-card border border-border rounded-xl shadow-2xl flex flex-col">
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
        className="absolute top-2 right-2 sm:top-4 sm:right-4 z-20 size-9 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <X className="size-4" />
      </button>

      <div className="px-4 sm:px-10 pt-4 sm:pt-8 pb-3 sm:pb-6 pr-12 flex-shrink-0">
        <h2
          id="welcome-title"
          className="text-xl sm:text-[28px] font-semibold tracking-[-0.02em] text-foreground leading-tight"
        >
          {t("welcome.title")} {t("welcome.titleHighlight")}
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
                <SlideCard
                  slide={slide}
                  onCta={onClose}
                  isMobile={isMobile}
                  active={slidesDef[current]?.key === slide.key}
                />
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
          className="size-9 inline-flex items-center justify-center rounded-md border border-input bg-card hover:bg-muted text-foreground transition-colors flex-shrink-0"
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
                "h-1.5 rounded-full transition-[width,background-color]",
                i === current
                  ? "w-6 sm:w-8 bg-foreground"
                  : "w-1.5 bg-input hover:bg-muted-foreground/60",
              )}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => api?.scrollNext()}
          aria-label={t("welcome.next")}
          className="size-9 inline-flex items-center justify-center rounded-md border border-input bg-card hover:bg-muted text-foreground transition-colors flex-shrink-0"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="px-3 sm:px-10 py-3 sm:py-4 border-t border-border flex items-center justify-between gap-3 flex-shrink-0">
        <label className="flex items-center gap-2 text-[13px] text-muted-foreground cursor-pointer select-none">
          <input
            type="checkbox"
            checked={dontShow}
            onChange={(e) => setDontShow(e.target.checked)}
            className="size-4 rounded border-input accent-foreground"
          />
          {t("welcome.dontShow")}
        </label>
        <button
          type="button"
          onClick={onClose}
          className="h-10 text-sm font-medium px-4 sm:px-5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap"
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
  active,
}: {
  slide: SlideDef;
  onCta: () => void;
  isMobile: boolean;
  active: boolean;
}) {
  const { t } = useTranslation();
  const base = `welcome.slides.${slide.key}`;
  const bullets = [t(`${base}.bullet1`), t(`${base}.bullet2`), t(`${base}.bullet3`)];

  return (
    <div className="relative h-full rounded-lg bg-muted overflow-hidden">
      <div
        className={cn(
          "relative h-full grid gap-4 sm:gap-6 md:gap-8 p-4 sm:p-6 md:p-8 transition-opacity duration-300",
          isMobile ? "grid-rows-[auto_1fr]" : "grid-cols-2",
          // Neighbouring slides peek in as plain tiles; only the current one shows its content.
          !active && !isMobile && "opacity-0",
        )}
      >
        <div className="flex flex-col justify-center min-w-0">
          <h3 className="text-xl sm:text-2xl lg:text-[32px] font-semibold tracking-[-0.02em] text-foreground leading-tight">
            {t(`${base}.title`)} {t(`${base}.highlight`)}
          </h3>
          <p className="mt-2 sm:mt-3 text-sm md:text-base text-muted-foreground leading-relaxed max-w-md">
            {t(`${base}.description`)}
          </p>
          <ul className="mt-3 sm:mt-4 space-y-1.5">
            {bullets.map((b) => (
              <li key={b} className="flex items-center gap-2 text-sm text-foreground">
                <span className="size-1.5 rounded-full bg-foreground flex-shrink-0" />
                {b}
              </li>
            ))}
          </ul>
          <div className="mt-3 sm:mt-5">
            <Link
              to={slide.to}
              onClick={onCta}
              className="inline-flex h-10 items-center gap-1.5 text-sm font-medium px-4 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors w-fit"
            >
              {t(`${base}.cta`)}
              <ChevronRight className="size-3.5" />
            </Link>
          </div>
        </div>

        {isMobile ? (
          <div className="relative min-h-0 flex items-center justify-center">
            <DeviceMockup
              variant="mobile"
              src={slide.mobile}
              alt={t(`${base}.altMobile`)}
              className="h-full max-h-full w-auto aspect-[9/19] max-w-[60%] [&_img]:h-full [&_img]:w-auto [&_img]:object-contain [&>div:last-child]:h-full [&>div:last-child]:flex [&>div:last-child]:items-center [&>div:last-child]:justify-center"
            />
          </div>
        ) : (
          <div className="relative">
            <DeviceMockup
              variant="desktop"
              src={slide.desktop}
              alt={t(`${base}.altDesktop`)}
              className="absolute top-6 left-0 w-[86%]"
            />
            <DeviceMockup
              variant="mobile"
              src={slide.mobile}
              alt={t(`${base}.altMobile`)}
              className="absolute bottom-0 right-0 w-[30%]"
            />
          </div>
        )}
      </div>
    </div>
  );
}
