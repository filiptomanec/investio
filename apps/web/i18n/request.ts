import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import { messages } from "@investio/i18n";
import type { Locale } from "@investio/i18n";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  // Fall back to defaultLocale if locale is undefined or not supported
  if (!locale || !routing.locales.includes(locale as Locale)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: messages[locale as Locale],
  };
});
