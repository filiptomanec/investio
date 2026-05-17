/**
 * Sign-up screen — auth UI stub (T-014).
 *
 * Form: email + password + password confirm, "Vytvořit účet" button.
 * Submit is a console.log stub — Supabase Auth wire-up arrives with
 * the real backend ticket.
 *
 * Styling via @investio/design-tokens (inline StyleSheet, no Tailwind).
 */

import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Link } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { tokens } from "@investio/design-tokens";

export default function SignupScreen() {
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordConfirmError, setPasswordConfirmError] = useState<string | null>(null);

  function handleSubmit() {
    // Reset errors
    setEmailError(null);
    setPasswordError(null);
    setPasswordConfirmError(null);

    // Minimal client-side validation stub
    let hasError = false;
    if (!email.trim()) {
      setEmailError(t("errors.validation"));
      hasError = true;
    }
    if (!password) {
      setPasswordError(t("errors.validation"));
      hasError = true;
    }
    if (!passwordConfirm) {
      setPasswordConfirmError(t("errors.validation"));
      hasError = true;
    } else if (password && passwordConfirm !== password) {
      setPasswordConfirmError(t("errors.validation"));
      hasError = true;
    }
    if (hasError) return;

    // TODO: connect to Supabase Auth
    // eslint-disable-next-line no-console
    console.log("TODO: connect to Supabase Auth", { email });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* Wordmark */}
          <Text
            style={styles.appName}
            accessibilityRole="header"
          >
            {t("common.appName")}
          </Text>

          <Text style={styles.heading}>{t("auth.signUp")}</Text>

          {/* Email field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t("auth.email")}</Text>
            <TextInput
              style={[
                styles.input,
                emailError ? styles.inputError : null,
              ]}
              value={email}
              onChangeText={setEmail}
              placeholder={t("auth.email")}
              placeholderTextColor={tokens.colors.light.mutedForeground}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
              accessibilityLabel={t("auth.email")}
              accessibilityHint="Enter your e-mail address"
            />
            {emailError ? (
              <Text style={styles.errorText} accessibilityRole="alert">
                {emailError}
              </Text>
            ) : null}
          </View>

          {/* Password field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t("auth.password")}</Text>
            <TextInput
              style={[
                styles.input,
                passwordError ? styles.inputError : null,
              ]}
              value={password}
              onChangeText={setPassword}
              placeholder={t("auth.password")}
              placeholderTextColor={tokens.colors.light.mutedForeground}
              secureTextEntry
              textContentType="newPassword"
              autoComplete="new-password"
              accessibilityLabel={t("auth.password")}
              accessibilityHint="Choose a password"
            />
            {passwordError ? (
              <Text style={styles.errorText} accessibilityRole="alert">
                {passwordError}
              </Text>
            ) : null}
          </View>

          {/* Password confirm field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t("auth.passwordConfirm")}</Text>
            <TextInput
              style={[
                styles.input,
                passwordConfirmError ? styles.inputError : null,
              ]}
              value={passwordConfirm}
              onChangeText={setPasswordConfirm}
              placeholder={t("auth.passwordConfirm")}
              placeholderTextColor={tokens.colors.light.mutedForeground}
              secureTextEntry
              textContentType="newPassword"
              autoComplete="new-password"
              accessibilityLabel={t("auth.passwordConfirm")}
              accessibilityHint="Repeat your chosen password"
            />
            {passwordConfirmError ? (
              <Text style={styles.errorText} accessibilityRole="alert">
                {passwordConfirmError}
              </Text>
            ) : null}
          </View>

          {/* Submit button */}
          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleSubmit}
            accessibilityRole="button"
            accessibilityLabel={t("auth.signUpCta")}
          >
            <Text style={styles.buttonText}>{t("auth.signUpCta")}</Text>
          </Pressable>

          {/* Link to login */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Máte účet?{" "}</Text>
            <Link href="/(auth)/login" asChild>
              <Pressable accessibilityRole="link" accessibilityLabel={t("auth.signIn")}>
                <Text style={styles.link}>{t("auth.signIn")}</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const c = tokens.colors.light;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: c.background,
  },
  flex: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
    gap: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: "700",
    color: c.primary,
    textAlign: "center",
    marginBottom: 4,
  },
  heading: {
    fontSize: 22,
    fontWeight: "600",
    color: c.foreground,
    textAlign: "center",
    marginBottom: 8,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: c.foreground,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: c.input,
    borderRadius: 6,
    paddingHorizontal: 12,
    fontSize: 16,
    color: c.foreground,
    backgroundColor: c.background,
  },
  inputError: {
    borderColor: c.destructive,
  },
  errorText: {
    fontSize: 12,
    color: c.destructive,
  },
  button: {
    height: 48,
    backgroundColor: c.primary,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: c.primaryForeground,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  footerText: {
    fontSize: 14,
    color: c.mutedForeground,
  },
  link: {
    fontSize: 14,
    fontWeight: "600",
    color: c.primary,
  },
});
