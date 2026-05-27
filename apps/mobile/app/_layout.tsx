import "../global.css";
import { useEffect } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from "@expo-google-fonts/jetbrains-mono";
import { I18nextProvider } from "react-i18next";
import { i18n } from "@investio/i18n";
import { useTheme } from "../hooks/useTheme";
import { useLanguageBootstrap } from "../hooks/useLanguageBootstrap";
import { hexTokens } from "../lib/tokens";

// Keep the splash screen visible while we load fonts and preferences.
void SplashScreen.preventAutoHideAsync();

function RootLayout() {
  const { theme, toggle, isReady: themeReady } = useTheme();
  const langReady = useLanguageBootstrap();

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });

  const appReady = (fontsLoaded || fontError != null) && themeReady && langReady;

  useEffect(() => {
    if (appReady) {
      void SplashScreen.hideAsync();
    }
  }, [appReady]);

  // Suppress unused variable warning — toggle is passed via context in practice
  void toggle;

  if (!appReady) {
    return null;
  }

  const palette = hexTokens[theme];

  return (
    <View
      style={{ flex: 1, backgroundColor: palette.background }}
      // Pass theme as a class so NativeWind dark: variants resolve
      className={theme === "dark" ? "dark" : ""}
    >
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: palette.background },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen
          name="methodology"
          options={{
            headerShown: true,
            title: "Metodika / Methodology",
            headerStyle: { backgroundColor: palette.card },
            headerTintColor: palette.foreground,
            presentation: "modal",
          }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
    </View>
  );
}

export default function Layout() {
  return (
    <I18nextProvider i18n={i18n}>
      <RootLayout />
    </I18nextProvider>
  );
}
