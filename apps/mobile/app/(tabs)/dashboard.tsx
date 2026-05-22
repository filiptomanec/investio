/**
 * Dashboard — T-016 (bolder mobile pass).
 *
 * Fetches scenarios directly from Supabase PostgREST (NOT via Next.js API).
 *
 * Bolder pass:
 *   - Greeting header + filter chips (All / Compound / Real Estate).
 *   - Scenario cards rounded 24, type badge top-left, big finalValue right,
 *     date below, long-press soft delete (kept).
 *   - Empty state: BookOpen icon with halo + 2 CTA pills.
 *   - "Backend not configured" banner becomes a softly tinted amber card.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

import { formatDate, formatCurrency } from "@investio/shared";
import { supabase, isBackendConfigured } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SkeletonCard } from "@/components/ui/skeleton";
import { useTheme, radii, typo, space, glowShadow } from "@/lib/theme";

interface ScenarioRow {
  id: string;
  title: string;
  type: "compound" | "real_estate";
  final_value?: number | null;
  updated_at: string;
  archived_at: string | null;
}

type LoadState = "idle" | "loading" | "refreshing" | "error" | "success";
type FilterKey = "all" | "compound" | "real_estate";

export default function DashboardScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const c = theme.colors;

  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [scenarios, setScenarios] = useState<ScenarioRow[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [filter, setFilter] = useState<FilterKey>("all");

  useEffect(() => {
    if (!isBackendConfigured) {
      setSessionChecked(true);
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(session !== null);
      setSessionChecked(true);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(session !== null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchScenarios = useCallback(
    async (isRefresh = false) => {
      if (!isBackendConfigured || !hasSession) return;
      setLoadState(isRefresh ? "refreshing" : "loading");
      setErrorMsg(null);
      const { data, error } = await supabase
        .from("scenario")
        .select("id, title, type, final_value, updated_at, archived_at")
        .is("archived_at", null)
        .order("updated_at", { ascending: false });
      if (error) {
        setErrorMsg(error.message);
        setLoadState("error");
        return;
      }
      setScenarios((data as ScenarioRow[]) ?? []);
      setLoadState("success");
    },
    [hasSession]
  );

  useEffect(() => {
    if (sessionChecked && hasSession) {
      fetchScenarios();
    } else if (sessionChecked && !hasSession && isBackendConfigured) {
      router.replace("/(auth)/login");
    }
  }, [sessionChecked, hasSession, fetchScenarios, router]);

  const handleDelete = useCallback(
    (id: string) => {
      Alert.alert(
        t("mobile.deleteScenario"),
        t("mobile.confirmDelete"),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("common.delete"),
            style: "destructive",
            onPress: async () => {
              const { error } = await supabase
                .from("scenario")
                .update({ archived_at: new Date().toISOString() })
                .eq("id", id);
              if (error) {
                Alert.alert(t("common.error"), error.message);
              } else {
                setScenarios((prev) => prev.filter((s) => s.id !== id));
              }
            },
          },
        ],
        { cancelable: true }
      );
    },
    [t]
  );

  const filteredScenarios = useMemo(
    () =>
      scenarios.filter((s) => (filter === "all" ? true : s.type === filter)),
    [scenarios, filter]
  );

  const greeting = t("mobile.dashboardGreeting");

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!isBackendConfigured) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: c.background }]}
        edges={["top", "bottom"]}
      >
        <View style={styles.headerRow}>
          <Text
            style={[typo.pageTitle, { color: c.foreground }]}
            accessibilityRole="header"
          >
            {t("dashboard.title")}
          </Text>
        </View>
        <View style={styles.banner}>
          <Card
            tone="muted"
            radius={radii.panel}
            style={[
              styles.bannerCard,
              {
                backgroundColor:
                  theme.mode === "dark" ? theme.amber[900] : theme.amber[50],
                borderColor:
                  theme.mode === "dark" ? theme.amber[700] : theme.amber[200],
              },
            ]}
          >
            <Ionicons
              name="alert-circle"
              size={22}
              color={
                theme.mode === "dark" ? theme.amber[300] : theme.amber[700]
              }
            />
            <Text
              style={[
                styles.bannerText,
                {
                  color:
                    theme.mode === "dark"
                      ? theme.amber[100]
                      : theme.amber[900],
                },
              ]}
            >
              {t("mobile.configBackend")}
            </Text>
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  if (loadState === "idle" || loadState === "loading") {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: c.background }]}
        edges={["top", "bottom"]}
      >
        <View style={styles.headerRow}>
          <Text
            style={[typo.pageTitle, { color: c.foreground }]}
            accessibilityRole="header"
          >
            {t("dashboard.title")}
          </Text>
        </View>
        <Text
          style={[
            styles.greeting,
            { color: c.mutedForeground, paddingHorizontal: space.gutter },
          ]}
        >
          {greeting}
        </Text>
        <View style={styles.skeletonList}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      </SafeAreaView>
    );
  }

  if (loadState === "error") {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: c.background }]}
        edges={["top", "bottom"]}
      >
        <View style={styles.centered}>
          <Ionicons
            name="cloud-offline-outline"
            size={56}
            color={c.mutedForeground}
          />
          <Text style={[styles.errorTitle, { color: c.foreground }]}>
            {t("errors.network")}
          </Text>
          <Text style={[styles.errorBody, { color: c.mutedForeground }]}>
            {errorMsg}
          </Text>
          <Button
            variant="primary"
            size="md"
            onPress={() => fetchScenarios()}
            style={styles.retryBtn}
            accessibilityLabel={t("mobile.retry")}
          >
            {t("mobile.retry")}
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: c.background }]}
      edges={["top", "bottom"]}
    >
      <FlatList
        data={filteredScenarios}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loadState === "refreshing"}
            onRefresh={() => fetchScenarios(true)}
            tintColor={c.primary}
            title={t("mobile.pullToRefresh")}
            titleColor={c.mutedForeground}
            accessibilityLabel={t("mobile.pullToRefresh")}
          />
        }
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text
              style={[typo.pageTitle, { color: c.foreground }]}
              accessibilityRole="header"
            >
              {t("dashboard.title")}
            </Text>
            <Text style={[styles.greeting, { color: c.mutedForeground }]}>
              {greeting}
            </Text>
            <FilterChips current={filter} onChange={setFilter} />
          </View>
        }
        ListEmptyComponent={<EmptyState />}
        renderItem={({ item }) => (
          <ScenarioCard
            scenario={item}
            onLongPress={() => handleDelete(item.id)}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

// ── Filter chips ────────────────────────────────────────────────────────────

function FilterChips({
  current,
  onChange,
}: {
  current: FilterKey;
  onChange: (f: FilterKey) => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const c = theme.colors;

  const items: { key: FilterKey; label: string }[] = [
    { key: "all", label: t("dashboard.filter.all") },
    { key: "compound", label: t("dashboard.filter.compound") },
    { key: "real_estate", label: t("dashboard.filter.realEstate") },
  ];

  return (
    <View style={styles.chipsRow}>
      {items.map((item) => {
        const active = current === item.key;
        return (
          <Pressable
            key={item.key}
            onPress={() => onChange(item.key)}
            accessibilityRole="button"
            accessibilityState={active ? { selected: true } : {}}
            accessibilityLabel={item.label}
            style={[
              styles.chip,
              {
                backgroundColor: active ? c.primary : "transparent",
                borderColor: active ? c.primary : c.border,
              },
            ]}
          >
            <Text
              style={[
                styles.chipLabel,
                {
                  color: active ? c.primaryForeground : c.foreground,
                },
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ── ScenarioCard ────────────────────────────────────────────────────────────

interface ScenarioCardProps {
  scenario: ScenarioRow;
  onLongPress: () => void;
}

function ScenarioCard({ scenario, onLongPress }: ScenarioCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const c = theme.colors;

  const typeLabel =
    scenario.type === "compound"
      ? t("dashboard.filter.compound")
      : t("dashboard.filter.realEstate");

  const badgeVariant: "accent-soft" | "info" =
    scenario.type === "compound" ? "accent-soft" : "info";

  return (
    <Pressable
      onLongPress={onLongPress}
      delayLongPress={400}
      accessibilityRole="button"
      accessibilityLabel={`${scenario.title}, ${typeLabel}`}
      accessibilityHint={t("mobile.longPressDelete")}
    >
      <Card style={styles.scenarioCard}>
        <View style={styles.scenarioRow}>
          <View style={styles.scenarioLeft}>
            <Badge variant={badgeVariant}>{typeLabel}</Badge>
            <Text
              style={[styles.scenarioTitle, { color: c.foreground }]}
              numberOfLines={2}
            >
              {scenario.title}
            </Text>
            <Text style={[styles.scenarioDate, { color: c.mutedForeground }]}>
              {formatDate(scenario.updated_at, "cs")}
            </Text>
          </View>
          <View style={styles.scenarioRight}>
            {scenario.final_value != null ? (
              <>
                <Text
                  style={[
                    styles.scenarioValueLabel,
                    { color: c.mutedForeground },
                  ]}
                >
                  {t("mobile.finalValueLabel")}
                </Text>
                <Text style={[styles.scenarioValue, { color: c.primary }]}>
                  {formatCurrency(scenario.final_value, "CZK", "cs")}
                </Text>
              </>
            ) : null}
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

// ── EmptyState ──────────────────────────────────────────────────────────────

function EmptyState() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const c = theme.colors;
  const accent = theme.mode === "dark" ? theme.teal[400] : theme.teal[600];
  const haloBg =
    theme.mode === "dark" ? theme.teal[900] : theme.teal[50];

  return (
    <View
      style={styles.emptyContainer}
      accessibilityLabel={t("dashboard.empty.title")}
    >
      <View
        style={[
          styles.emptyHalo,
          { backgroundColor: haloBg, ...glowShadow(theme, 0.3) },
        ]}
      >
        <Ionicons name="book-outline" size={36} color={accent} />
      </View>
      <Text style={[styles.emptyTitle, { color: c.foreground }]}>
        {t("dashboard.empty.title")}
      </Text>
      <Text style={[styles.emptyHint, { color: c.mutedForeground }]}>
        {t("mobile.emptyHint")}
      </Text>
      <Button
        variant="primary"
        size="md"
        onPress={() => router.push("/(tabs)")}
        style={styles.emptyBtn}
        accessibilityLabel={t("dashboard.empty.compoundCta")}
      >
        {t("dashboard.empty.compoundCta")}
      </Button>
      <Button
        variant="outline"
        size="md"
        onPress={() => router.push("/(tabs)/real-estate")}
        style={styles.emptyBtn}
        accessibilityLabel={t("dashboard.empty.realEstateCta")}
      >
        {t("dashboard.empty.realEstateCta")}
      </Button>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },
  list: { padding: space.gutter, gap: 12, flexGrow: 1 },
  listHeader: {
    marginBottom: 4,
    gap: 8,
  },
  headerRow: {
    paddingHorizontal: space.gutter,
    paddingTop: 8,
    marginBottom: 4,
  },
  greeting: {
    fontSize: 14,
    fontWeight: "500",
  },
  separator: { height: 12 },
  skeletonList: { padding: space.gutter, gap: 12 },

  centered: {
    flex: 1,
    padding: 32,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  errorBody: {
    fontSize: 13,
    textAlign: "center",
  },
  retryBtn: { marginTop: 8, minWidth: 160 },

  // Banner
  banner: {
    paddingHorizontal: space.gutter,
    marginTop: 12,
  },
  bannerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  bannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },

  // Filter chips
  chipsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
    marginBottom: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1.5,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: "700",
  },

  // Scenario card
  scenarioCard: {
    paddingVertical: 18,
    paddingHorizontal: 18,
  },
  scenarioRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  scenarioLeft: {
    flex: 1,
    gap: 8,
  },
  scenarioRight: {
    alignItems: "flex-end",
    gap: 2,
  },
  scenarioTitle: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.1,
  },
  scenarioDate: {
    fontSize: 12,
    fontWeight: "500",
  },
  scenarioValueLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  scenarioValue: {
    fontSize: 18,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    letterSpacing: -0.3,
  },

  // Empty
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 32,
    paddingHorizontal: 24,
    gap: 12,
  },
  emptyHalo: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.3,
  },
  emptyHint: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 8,
    lineHeight: 20,
  },
  emptyBtn: { width: "100%", marginBottom: 6 },
});
