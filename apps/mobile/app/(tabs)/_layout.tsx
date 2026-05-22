/**
 * Bottom tab navigator — 4 tabs:
 *   index       → Compound interest calculator
 *   real-estate → Real estate calculator
 *   compare     → Comparison view
 *   dashboard   → Scenario list (Supabase)
 *
 * Bolder mobile pass (PR design/investio-mobile-bolder-pass-1):
 *   - Active tab is a teal accent pill behind icon + label (per references —
 *     Dropped Packages, Affitto, Nusantara). Inactive tabs are muted icon
 *     only (label hidden) to give the active pill room to breathe.
 *   - Tab bar bg uses card color with a hairline top border. Safe-area bottom
 *     respected via paddingBottom.
 *   - Soft haptic on tab change (`HapticTab` already wires impactAsync; we
 *     keep it).
 */
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

import { useTheme, radii } from "@/lib/theme";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

const ICON_ACTIVE: Record<string, IoniconName> = {
  index: "trending-up",
  "real-estate": "home",
  compare: "git-compare",
  dashboard: "albums",
};

const ICON_INACTIVE: Record<string, IoniconName> = {
  index: "trending-up-outline",
  "real-estate": "home-outline",
  compare: "git-compare-outline",
  dashboard: "albums-outline",
};

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("mobile.tabs.compound"),
          tabBarAccessibilityLabel: t("mobile.tabs.compound"),
        }}
      />
      <Tabs.Screen
        name="real-estate"
        options={{
          title: t("mobile.tabs.realEstate"),
          tabBarAccessibilityLabel: t("mobile.tabs.realEstate"),
        }}
      />
      <Tabs.Screen
        name="compare"
        options={{
          title: t("mobile.tabs.compare"),
          tabBarAccessibilityLabel: t("mobile.tabs.compare"),
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t("mobile.tabs.dashboard"),
          tabBarAccessibilityLabel: t("mobile.tabs.dashboard"),
        }}
      />
      {/* Hide the legacy explore tab if it still exists */}
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}

// ── Custom tab bar with active pill ─────────────────────────────────────────

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const theme = useTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();

  const pillBg = useMemo(
    () => (theme.mode === "dark" ? theme.teal[900] : theme.teal[100]),
    [theme]
  );
  const pillFg = useMemo(
    () => (theme.mode === "dark" ? theme.teal[200] : theme.teal[800]),
    [theme]
  );

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: c.card,
          borderTopColor: c.border,
          paddingBottom: Math.max(insets.bottom, 10),
        },
      ]}
    >
      {state.routes
        .filter((route) => {
          // Hide routes marked href:null (legacy explore tab)
          const descriptor = descriptors[route.key];
          const opts = descriptor?.options as { href?: string | null } | undefined;
          return opts?.href !== null;
        })
        .map((route) => {
          const { options } = descriptors[route.key]!;
          const realIndex = state.routes.findIndex((r) => r.key === route.key);
          const focused = state.index === realIndex;

          const label = options.title ?? route.name;
          const iconName = focused
            ? (ICON_ACTIVE[route.name] ?? "ellipse")
            : (ICON_INACTIVE[route.name] ?? "ellipse-outline");

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              if (process.env.EXPO_OS === "ios") {
                Haptics.selectionAsync();
              }
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={styles.tab}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={
                options.tabBarAccessibilityLabel as string | undefined
              }
            >
              <View
                style={[
                  styles.pill,
                  focused
                    ? { backgroundColor: pillBg }
                    : { backgroundColor: "transparent" },
                ]}
              >
                <Ionicons
                  name={iconName}
                  size={focused ? 19 : 22}
                  color={focused ? pillFg : c.mutedForeground}
                />
                {focused ? (
                  <Text
                    style={[styles.pillLabel, { color: pillFg }]}
                    numberOfLines={1}
                  >
                    {label}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          );
        })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    borderTopWidth: 1,
    paddingTop: 10,
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radii.pill,
    gap: 6,
    minHeight: 38,
  },
  pillLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
