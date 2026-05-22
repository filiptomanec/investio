/**
 * Login screen — auth UI stub (T-014, bolder mobile pass).
 *
 *   - Hero typography "Vítej zpět" at 32px / 900
 *   - Background radial halo behind the hero (subtle teal bloom)
 *   - Email + password use the themed Input primitive
 *   - Primary CTA is a full-width pill with accent glow
 *   - Google OAuth button is an outlined pill row with the "G" mark
 *     (no lucide RN installed — we use a small letter mark to avoid extra deps)
 *   - Bottom link rendered with bold weight on the action verb
 */

import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTheme, radii, typo, space } from "@/lib/theme";

export default function LoginScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const c = theme.colors;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  function handleSubmit() {
    setEmailError(null);
    setPasswordError(null);

    let hasError = false;
    if (!email.trim()) {
      setEmailError(t("errors.validation"));
      hasError = true;
    }
    if (!password) {
      setPasswordError(t("errors.validation"));
      hasError = true;
    }
    if (hasError) return;

    // TODO: connect to Supabase Auth — stub for the design pass.
    console.log("TODO: connect to Supabase Auth", { email });
  }

  function handleGoogle() {
    console.log("TODO: Google OAuth via Supabase");
  }

  const haloBg =
    theme.mode === "dark" ? theme.teal[800] : theme.teal[200];

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: c.background }]}
      edges={["top", "bottom"]}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Halo behind title */}
          <View
            style={[styles.halo, { backgroundColor: haloBg, opacity: 0.4 }]}
            pointerEvents="none"
          />

          {/* Brand wordmark */}
          <Text
            style={[styles.appName, { color: c.primary }]}
            accessibilityRole="header"
          >
            {t("common.appName")}
          </Text>

          {/* Hero heading */}
          <Text
            style={[
              typo.authHero,
              { color: c.foreground, textAlign: "center" },
            ]}
          >
            {t("auth.welcomeBack")}
          </Text>
          <Text
            style={[styles.subtitle, { color: c.mutedForeground }]}
          >
            {t("auth.signInSubtitle")}
          </Text>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label={t("auth.email")}
              value={email}
              onChangeText={setEmail}
              placeholder="vy@email.cz"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
              error={emailError}
              accessibilityHint="Enter your e-mail address"
            />
            <Input
              label={t("auth.password")}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              textContentType="password"
              autoComplete="current-password"
              error={passwordError}
              accessibilityHint="Enter your password"
            />
          </View>

          {/* Primary CTA */}
          <Button
            variant="primary"
            size="lg"
            fullWidth
            glow
            onPress={handleSubmit}
            accessibilityLabel={t("auth.signInCta")}
          >
            {t("auth.signInCta")}
          </Button>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: c.border }]} />
            <Text style={[styles.dividerText, { color: c.mutedForeground }]}>
              {t("auth.or")}
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: c.border }]} />
          </View>

          {/* Google OAuth */}
          <Button
            variant="outline"
            size="lg"
            fullWidth
            onPress={handleGoogle}
            leading={<GoogleMark />}
            accessibilityLabel={t("auth.signInWithGoogle")}
          >
            {t("auth.signInWithGoogle")}
          </Button>

          {/* Bottom link */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: c.mutedForeground }]}>
              {t("auth.noAccount")}{" "}
            </Text>
            <Link href="/(auth)/signup" asChild>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={t("auth.signUp")}
              >
                <Text style={[styles.link, { color: c.primary }]}>
                  {t("auth.signUp")}
                </Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/**
 * Tiny brand-neutral "G" mark for the Google button.
 * Using a Text glyph keeps us free of `react-native-svg` / extra deps.
 */
function GoogleMark() {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.googleMark,
        {
          backgroundColor:
            theme.mode === "dark" ? theme.slate[700] : theme.slate[100],
          borderRadius: radii.badge,
        },
      ]}
    >
      <Text
        style={[
          styles.googleMarkText,
          { color: theme.mode === "dark" ? theme.slate[50] : theme.slate[900] },
        ]}
      >
        G
      </Text>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 14,
  },
  halo: {
    position: "absolute",
    top: 40,
    left: -60,
    right: -60,
    height: 260,
    borderRadius: 260,
  },
  appName: {
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 8,
    lineHeight: 20,
  },
  form: {
    gap: 12,
    marginTop: 8,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  googleMark: {
    width: 22,
    height: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  googleMarkText: {
    fontSize: 14,
    fontWeight: "800",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  footerText: {
    fontSize: 14,
    fontWeight: "500",
  },
  link: {
    fontSize: 14,
    fontWeight: "800",
  },
});

void space;
