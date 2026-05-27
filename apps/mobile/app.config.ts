import type { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Investio",
  slug: "investio",
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  icon: "./assets/icon.png",
  scheme: "investio",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "cover",
    backgroundColor: "#0d9488",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.tomanec.investio",
    buildNumber: "1",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      UIRequiresFullScreen: false,
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#0d9488",
    },
    package: "com.tomanec.investio",
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/icon.png",
  },
  plugins: [
    "expo-router",
    "expo-font",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#0d9488",
        image: "./assets/splash.png",
        imageWidth: 200,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: "96b2cfb6-d133-4fc4-8b32-8882c59b8c7b",
    },
  },
  owner: "filiptomanecs-organization",
});
