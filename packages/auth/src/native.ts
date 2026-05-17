// @investio/auth — native client factory (Expo / React Native)
//
// Uses @supabase/supabase-js with a custom storage adapter that wraps
// expo-secure-store so session tokens are stored in:
//   iOS  → Keychain
//   Android → EncryptedSharedPreferences
//
// NEVER use AsyncStorage for auth tokens (T-014 constraint).

import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";

export type { Session, User, AuthError } from "@supabase/supabase-js";

/**
 * expo-secure-store adapter for @supabase/supabase-js custom storage.
 *
 * getItem must return null (not undefined) for missing keys — Supabase
 * internal code treats undefined as "not initialized" vs null as "empty".
 */
const SecureStoreAdapter = {
  getItem: (key: string): Promise<string | null> =>
    SecureStore.getItemAsync(key),
  setItem: (key: string, value: string): Promise<void> =>
    SecureStore.setItemAsync(key, value),
  removeItem: (key: string): Promise<void> =>
    SecureStore.deleteItemAsync(key),
};

/**
 * Create a Supabase client configured for React Native / Expo.
 *
 * Call this once per app session (e.g. in a module-level singleton in
 * `apps/mobile/lib/supabase.ts`). Do NOT call at import time — URLs must
 * come from env/config, not hardcoded constants.
 *
 * @param supabaseUrl   - Supabase project URL (e.g. https://<ref>.supabase.co)
 * @param supabaseAnonKey - Supabase anon/public API key
 */
export function createNativeClient(
  supabaseUrl: string,
  supabaseAnonKey: string
): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: SecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}
