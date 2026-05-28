import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { hapticLight, syncStatusBarStyle } from "@/lib/native";

// Reads the theme that the pre-hydration script in __root.tsx applied to
// <html>, then keeps it in sync with localStorage, the iOS status bar style,
// and a light haptic on toggle.
export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useLayoutEffect(() => {
    if (typeof document === "undefined") return;
    const actual = document.documentElement.classList.contains("dark") ? "dark" : "light";
    if (actual !== theme) setTheme(actual);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("investio-theme", theme);
    syncStatusBarStyle(theme);
  }, [theme]);

  const toggle = useCallback(() => {
    hapticLight();
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  return { theme, toggle };
}
