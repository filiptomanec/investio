import type { MetadataRoute } from "next";

const BASE_URL =
  process.env["NEXT_PUBLIC_SITE_URL"]?.replace(/\/$/, "") ??
  "https://investio.filiptomanec.cz";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/cs/dashboard", "/en/dashboard"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
