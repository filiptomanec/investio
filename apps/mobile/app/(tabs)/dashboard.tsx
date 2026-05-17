/**
 * Dashboard — T-016.
 *
 * Fetches scenarios directly from Supabase PostgREST (NOT via Next.js API).
 * architecture.md: "Mobile NEpoužívá Next.js Route Handlers."
 *
 * Features:
 *  - FlatList with ScenarioCard
 *  - Pull-to-refresh via RefreshControl
 *  - Long-press → alert with "Smazat" (soft delete: archived_at = now())
 *  - Auth gate: no session → navigate to /(auth)/login
 *  - No backend configured → banner instead of crash
 *  - Empty state with CTAs to compound / real-estate tabs
 */

import { useCallback, useEffect, useState } from "react";
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

import { formatDate, formatCurrency } from "@investio/shared";
import { tokens } from "@investio/design-tokens";
import { supabase, isBackendConfigured } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SkeletonCard } from "@/components/ui/skeleton";

const c = tokens.colors.light;

// Row shape from Supabase `scenario` table (matches data-model.md)
interface ScenarioRow {
  id: string;
  title: string;
  type: "compound" | "real_estate";
  // computed_result is JSON stored by server but we show what we have
  final_value?: number | null;
  updated_at: string;
  archived_at: string | null;
}

type LoadState = "idle" | "loading" | "refreshing" | "error" | "success";

export default function DashboardScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [scenarios, setScenarios] = useState<ScenarioRow[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  // ── Auth gate ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isBackendConfigured) {
      setSessionChecked(true);
      return;
    }

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(session !== null);
      setSessionChecked(true);
    });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setHasSession(session !== null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ── Data fetch ───────────────────────────────────────────────────────────────
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
      // No session — navigate to login
      router.replace("/(auth)/login");
    }
  }, [sessionChecked, hasSession, fetchScenarios, router]);

  // ── Delete (soft) ────────────────────────────────────────────────────────────
  const handleDelete = useCallback(
    (id: string, title: string) => {
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

  // ── Render ───────────────────────────────────────────────────────────────────

  // No backend configured
  if (!isBackendConfigured) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{t("mobile.configBackend")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Loading skeletons
  if (loadState === "idle" || loadState === "loading") {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">
            {t("dashboard.title")}
          </Text>
        </View>
        <View style={styles.skeletonList}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (loadState === "error") {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>
            {t("errors.network")}: {errorMsg}
          </Text>
          <Button
            variant="secondary"
            onPress={() => fetchScenarios()}
            style={styles.retryBtn}
            accessibilityLabel="Zkusit znovu"
          >
            Zkusit znovu
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <FlatList
        data={scenarios}
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
          <View style={styles.header}>
            <Text style={styles.title} accessibilityRole="header">
              {t("dashboard.title")}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState />
        }
        renderItem={({ item }) => (
          <ScenarioCard
            scenario={item}
            onLongPress={() => handleDelete(item.id, item.title)}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

// ── ScenarioCard ──────────────────────────────────────────────────────────────

interface ScenarioCardProps {
  scenario: ScenarioRow;
  onLongPress: () => void;
}

function ScenarioCard({ scenario, onLongPress }: ScenarioCardProps) {
  const { t } = useTranslation();

  const typeLabel =
    scenario.type === "compound"
      ? t("dashboard.filter.compound")
      : t("dashboard.filter.realEstate");

  const typeBadgeVariant = scenario.type === "compound" ? "info" : "success";

  return (
    <Pressable
      onLongPress={onLongPress}
      delayLongPress={400}
      accessibilityRole="button"
      accessibilityLabel={`${scenario.title}, ${typeLabel}`}
      accessibilityHint="Dlouhé stisknutí pro možnosti (smazat)"
    >
      <Card style={styles.scenarioCard} noPadding>
        <View style={styles.cardContent}>
          <View style={styles.cardLeft}>
            <Badge variant={typeBadgeVariant}>{typeLabel}</Badge>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {scenario.title}
            </Text>
            {scenario.final_value != null ? (
              <Text style={styles.cardValue}>
                {formatCurrency(scenario.final_value, "CZK", "cs")}
              </Text>
            ) : null}
          </View>
          <Text style={styles.cardDate}>
            {formatDate(scenario.updated_at, "cs")}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────

function EmptyState() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View style={styles.emptyContainer} accessibilityLabel="Prázdný přehled">
      <Text style={styles.emptyTitle}>{t("dashboard.empty.title")}</Text>
      <Text style={styles.emptyHint}>
        Vytvořte první kalkulačku nebo prozkoumejte šablony.
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
        variant="secondary"
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

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },
  list: { padding: 16, gap: 8, flexGrow: 1 },
  header: { marginBottom: 8 },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: c.foreground,
  },
  separator: { height: 8 },
  skeletonList: { padding: 16, gap: 12 },
  centered: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    color: c.destructive,
    textAlign: "center",
  },
  retryBtn: { marginTop: 8 },

  // Banner for unconfigured backend
  banner: {
    margin: 16,
    padding: 16,
    backgroundColor: c.accent,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: c.border,
  },
  bannerText: {
    fontSize: 13,
    color: c.accentForeground,
    textAlign: "center",
  },

  // Scenario card
  scenarioCard: {},
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 14,
    gap: 8,
  },
  cardLeft: { flex: 1, gap: 4 },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: c.foreground,
  },
  cardValue: {
    fontSize: 14,
    color: c.primary,
    fontWeight: "600",
  },
  cardDate: {
    fontSize: 11,
    color: c.mutedForeground,
    textAlign: "right",
    flexShrink: 0,
    maxWidth: 100,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    paddingHorizontal: 24,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: c.foreground,
    textAlign: "center",
  },
  emptyHint: {
    fontSize: 14,
    color: c.mutedForeground,
    textAlign: "center",
    marginBottom: 8,
  },
  emptyBtn: { width: "100%", marginBottom: 4 },
});
