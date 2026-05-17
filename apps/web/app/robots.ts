import type { MetadataRoute } from "next";

const BASE_URL = "https://investio.app";

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
