import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["cs", "en"] as const,
  defaultLocale: "cs",
  localePrefix: "as-needed",
});
