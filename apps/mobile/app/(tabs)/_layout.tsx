/**
 * Bottom tab navigator — 4 tabs:
 *   index       → Compound interest calculator
 *   real-estate → Real estate calculator
 *   compare     → Comparison view
 *   dashboard   → Scenario list (Supabase)
 */
import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import { HapticTab } from "@/components/haptic-tab";
import { tokens } from "@investio/design-tokens";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";

const c = tokens.colors.light;
const cDark = tokens.colors.dark;

export default function TabLayout() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const activeTint = isDark ? cDark.primary : c.primary;
  const inactiveTint = isDark ? cDark.mutedForeground : c.mutedForeground;
  const tabBarBg = isDark ? cDark.card : c.card;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeTint,
        tabBarInactiveTintColor: inactiveTint,
        tabBarStyle: {
          backgroundColor: tabBarBg,
          borderTopColor: isDark ? cDark.border : c.border,
        },
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("mobile.tabs.compound"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" size={size} color={color} />
          ),
          tabBarAccessibilityLabel: t("mobile.tabs.compound"),
        }}
      />
      <Tabs.Screen
        name="real-estate"
        options={{
          title: t("mobile.tabs.realEstate"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="business-outline" size={size} color={color} />
          ),
          tabBarAccessibilityLabel: t("mobile.tabs.realEstate"),
        }}
      />
      <Tabs.Screen
        name="compare"
        options={{
          title: t("mobile.tabs.compare"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="git-compare-outline" size={size} color={color} />
          ),
          tabBarAccessibilityLabel: t("mobile.tabs.compare"),
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t("mobile.tabs.dashboard"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size} color={color} />
          ),
          tabBarAccessibilityLabel: t("mobile.tabs.dashboard"),
        }}
      />
      {/* Hide the legacy explore tab if it still exists */}
      <Tabs.Screen
        name="explore"
        options={{ href: null }}
      />
    </Tabs>
  );
}
