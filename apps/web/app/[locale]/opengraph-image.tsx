import { ImageResponse } from "next/og";

export const alt = "Investio — Porovnej akcie s nemovitostmi";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const isEn = locale === "en";
  const tagline = isEn
    ? "Compare stocks and real estate in 5 minutes"
    : "Porovnej akcie s nemovitostmi za 5 minut";
  const sub = isEn
    ? "Free investment calculator · CZ + EN"
    : "Bezplatná investiční kalkulačka · CZ + EN";

  // Brand teal: #0f766e  (primary)
  // Brand amber: #f59e0b (accent)
  const TEAL = "#0f766e";
  const AMBER = "#f59e0b";
  const WHITE = "#ffffff";
  const TEAL_LIGHT = "#ccfbf1"; // teal-100 approximate

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: TEAL,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background geometric dot pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />

        {/* Amber accent stripe — bottom */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 8,
            backgroundColor: AMBER,
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "64px 80px",
            flex: 1,
            justifyContent: "space-between",
          }}
        >
          {/* Logo row */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                backgroundColor: "rgba(255,255,255,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 26,
                fontWeight: 700,
                color: WHITE,
              }}
            >
              I
            </div>
            <span
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: WHITE,
                letterSpacing: "-0.02em",
              }}
            >
              Investio
            </span>
          </div>

          {/* Main text */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div
              style={{
                fontSize: 54,
                fontWeight: 700,
                color: WHITE,
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                maxWidth: 900,
              }}
            >
              {tagline}
            </div>

            <div
              style={{
                fontSize: 22,
                color: TEAL_LIGHT,
                fontWeight: 400,
              }}
            >
              {sub}
            </div>
          </div>

          {/* Bottom row — amber badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                backgroundColor: AMBER,
                borderRadius: 999,
                padding: "8px 20px",
                fontSize: 16,
                fontWeight: 600,
                color: "#1c1917",
              }}
            >
              investio.app
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
