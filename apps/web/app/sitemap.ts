import type { MetadataRoute } from "next";

const BASE_URL =
  process.env["NEXT_PUBLIC_SITE_URL"]?.replace(/\/$/, "") ??
  "https://investio.filiptomanec.cz";
const LOCALES = ["cs", "en"] as const;

// Routes available in both locales (no leading slash after locale)
const PUBLIC_ROUTES = [
  { path: "", priority: 1.0, changeFrequency: "monthly" as const },
  { path: "/calc/compound", priority: 0.9, changeFrequency: "monthly" as const },
  { path: "/calc/real-estate", priority: 0.9, changeFrequency: "monthly" as const },
  { path: "/compare", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/login", priority: 0.5, changeFrequency: "yearly" as const },
  { path: "/signup", priority: 0.7, changeFrequency: "yearly" as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const route of PUBLIC_ROUTES) {
    // Default locale (cs) uses localePrefix: "as-needed" → no prefix for root,
    // but we still include /cs explicitly for hreflang alternates.
    const csUrl = `${BASE_URL}/cs${route.path}`;
    const enUrl = `${BASE_URL}/en${route.path}`;

    entries.push({
      url: csUrl,
      lastModified,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      alternates: {
        languages: {
          cs: csUrl,
          en: enUrl,
        },
      },
    });

    entries.push({
      url: enUrl,
      lastModified,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      alternates: {
        languages: {
          cs: csUrl,
          en: enUrl,
        },
      },
    });
  }

  return entries;
}

// Silence unused import warning — LOCALES used for documentation only
void LOCALES;
