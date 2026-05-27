/**
 * Native Capacitor plugin wrappers.
 *
 * All calls are gated on `Capacitor.isNativePlatform()` so they are no-ops
 * on the web — no errors, no console warnings, zero overhead in browsers.
 */
import { Capacitor } from "@capacitor/core";

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
