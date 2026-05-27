/**
 * Native Capacitor plugin wrappers.
 *
 * All calls are gated on `Capacitor.isNativePlatform()` so they are no-ops
 * on the web — no errors, no console warnings, zero overhead in browsers.
 */
import { Capacitor } from "@capacitor/core";

/**
 * Marks the <html> element with `capacitor-native` class when running inside
 * a Capacitor WKWebView. This class gates all iOS-only CSS rules (safe-area
 * padding, text-selection disable, zoom prevention, etc.) so the web build
 * is completely unaffected.
 *
 * Call this as early as possible — ideally at module import time — so that
 * the class is set before the first paint.
 */
export function markNativePlatform(): void {
  if (Capacitor.isNativePlatform()) {
    document.documentElement.classList.add("capacitor-native");
  }
}

/**
 * Hides the splash screen. Call once the React app has fully mounted and is
 * ready to display (i.e. inside a useEffect with an empty dependency array).
 */
export async function hideSplashScreen(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  const { SplashScreen } = await import("@capacitor/splash-screen");
  await SplashScreen.hide({ fadeOutDuration: 300 });
}

/**
 * Syncs the iOS status bar style with the current app theme.
 * "dark" theme → light icons on the status bar (Style.Dark)
 * "light" theme → dark icons on the status bar (Style.Light)
 */
export async function syncStatusBarStyle(theme: "dark" | "light"): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  const { StatusBar, Style } = await import("@capacitor/status-bar");
  await StatusBar.setStyle({ style: theme === "dark" ? Style.Dark : Style.Light });
}

/**
 * Fires a light haptic impact. Use for toggle actions (theme, language).
 */
export async function hapticLight(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
  await Haptics.impact({ style: ImpactStyle.Light });
}
