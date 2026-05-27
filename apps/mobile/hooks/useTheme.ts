import { useCallback, useEffect, useState } from "react";
import { Appearance } from "react-native";
import { useColorScheme } from "nativewind";
import { getTheme, setTheme } from "../lib/storage";
import type { Theme } from "../lib/tokens";

interface UseThemeReturn {
  theme: Theme;
  toggle: () => void;
  isReady: boolean;
}

/**
 * Resolves the active theme in priority order:
 * 1. Stored override (AsyncStorage "investio-theme")
 * 2. iOS system appearance (Appearance.getColorScheme())
 *
 * Design note: Unlike the web (which defaults to "dark" for historical reasons),
 * mobile respects the system appearance on first launch — iOS users expect this.
 * This is the only intentional behavioral deviation from the web. See DESIGN.md §9.1.
 */
export function useTheme(): UseThemeReturn {
  const systemScheme = Appearance.getColorScheme();
  const systemDefault: Theme = systemScheme === "light" ? "light" : "dark";

  const [theme, setThemeState] = useState<Theme>(systemDefault);
  const [isReady, setIsReady] = useState(false);

  // NativeWind's imperative API for resolving dark: variants
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    // Load stored preference on mount
    void getTheme().then((stored) => {
      const resolved: Theme = stored ?? systemDefault;
      setThemeState(resolved);
      setColorScheme(resolved);
      setIsReady(true);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for system theme changes (only applies when no override is stored)
  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      // Only follow system when there's no stored override
      void getTheme().then((stored) => {
        if (stored == null) {
          const resolved: Theme = colorScheme === "light" ? "light" : "dark";
          setThemeState(resolved);
          setColorScheme(resolved);
        }
      });
    });
    return () => sub.remove();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = useCallback(() => {
    setThemeState((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      setColorScheme(next);
      void setTheme(next);
      return next;
    });
  }, [setColorScheme]);

  return { theme, toggle, isReady };
}
