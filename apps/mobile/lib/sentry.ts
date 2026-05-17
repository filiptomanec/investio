import * as Sentry from "@sentry/react-native";

// Opt-in: if EXPO_PUBLIC_SENTRY_DSN is not set, Sentry is not initialized
// and the app runs without any monitoring overhead. Set the env var (in EAS
// secrets or your local .env) to enable.
export function initSentry(): void {
  if (!process.env.EXPO_PUBLIC_SENTRY_DSN) return;

  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    enabled: true,
    // eslint-disable-next-line no-undef
    environment: __DEV__ ? "development" : "production",
    tracesSampleRate: 0.1,
    // Do not attach default PII (device locale, etc.) automatically
    sendDefaultPii: false,
  });
}
