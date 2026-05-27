import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Theme } from "./tokens";
import type { Locale } from "@investio/i18n";

const THEME_KEY = "investio-theme";
const LANG_KEY = "investio-lang";

export async function getTheme(): Promise<Theme | null> {
  try {
    const value = await AsyncStorage.getItem(THEME_KEY);
    if (value === "light" || value === "dark") return value;
    return null;
  } catch {
    return null;
  }
}

export async function setTheme(theme: Theme): Promise<void> {
  try {
    await AsyncStorage.setItem(THEME_KEY, theme);
  } catch {
    // Storage failure is non-fatal — preference won't persist but app keeps running
  }
}

export async function getLang(): Promise<Locale | null> {
  try {
    const value = await AsyncStorage.getItem(LANG_KEY);
    if (value === "cs" || value === "en") return value;
    return null;
  } catch {
    return null;
  }
}

export async function setLang(lang: Locale): Promise<void> {
  try {
    await AsyncStorage.setItem(LANG_KEY, lang);
  } catch {
    // Non-fatal
  }
}
