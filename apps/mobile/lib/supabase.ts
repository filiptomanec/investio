/**
 * Supabase singleton client for React Native / Expo.
 *
 * Mobile goes directly against Supabase PostgREST — NOT via Next.js API.
 * (architecture.md: "Mobile NEpoužívá Next.js Route Handlers")
 *
 * Session tokens are persisted in expo-secure-store (Keychain / EncryptedSharedPreferences).
 * NEVER AsyncStorage for auth tokens.
 */
import { createNativeClient } from "@investio/auth/native";
import type { SupabaseClient } from "@supabase/supabase-js";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * Whether backend env vars are configured.
 * If false, the dashboard shows a configuration banner instead of crashing.
 */
export const isBackendConfigured: boolean = url !== "" && key !== "";

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
export const supabase: SupabaseClient = isBackendConfigured
  ? createNativeClient(url, key)
  : // Dummy client that will error on any query — callers check isBackendConfigured first
    createNativeClient("https://placeholder.supabase.co", "placeholder-key");
