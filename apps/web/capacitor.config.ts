import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.tomanec.investio",
  appName: "Investio",
  // Points to the static SPA build produced by `pnpm build:spa`
  webDir: "dist-spa",
  ios: {
    // Respect the safe-area insets (notch, home indicator) natively
    contentInset: "always",
  },
  plugins: {
    SplashScreen: {
      // We hide the splash manually once the React app has mounted
      launchAutoHide: false,
      backgroundColor: "#0d9488",
      showSpinner: false,
    },
    StatusBar: {
      // Runtime: toggled between Dark/Light in useTheme() via StatusBar.setStyle()
      style: "DARK",
      // overlaysWebView: true lets the WKWebView extend behind the status bar so
      // the app background colour fills that region (via env(safe-area-inset-top)
      // padding in CSS).  With false the status bar sits outside the webview,
      // which leaves a black strip from the native UIView background.
      overlaysWebView: true,
    },
  },
};

export default config;
