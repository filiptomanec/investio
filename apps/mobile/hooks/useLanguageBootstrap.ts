import { useEffect, useState } from "react";
import { getLocales } from "expo-localization";
import { i18n, supportedLocales, defaultLocale, type Locale } from "@investio/i18n";
import { getLang, setLang } from "../lib/storage";

/**
 * Bootstraps the i18n locale on app start:
 * 1. Check AsyncStorage for a stored override ("investio-lang")
 * 2. Fall back to the device's primary locale (expo-localization)
 * 3. If neither maps to a supported locale, fall back to "cs" (default)
 *
 * Returns true when the locale is resolved and i18n is ready to use.
 */
export function useLanguageBootstrap(): boolean {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    void (async () => {
      const stored = await getLang();
      if (stored != null) {
        await i18n.changeLanguage(stored);
        setIsReady(true);
        return;
      }

      // Detect from device locale
      const locales = getLocales();
      const deviceLang = locales[0]?.languageCode ?? null;
      const resolved: Locale =
        deviceLang != null && (supportedLocales as string[]).includes(deviceLang)
          ? (deviceLang as Locale)
          : defaultLocale;

      await i18n.changeLanguage(resolved);
      setIsReady(true);
    })();
  }, []);

  return isReady;
}

/**
 * Persists a language change triggered by the user and updates i18n.
 */
export async function changeLanguage(lang: Locale): Promise<void> {
  await setLang(lang);
  await i18n.changeLanguage(lang);
}
