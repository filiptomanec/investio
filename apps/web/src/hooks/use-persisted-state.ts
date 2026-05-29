import { useEffect, useState } from "react";

// Persists state in localStorage under a stable key. The first client render
// reads the persisted value synchronously via a lazy initializer, so the
// initial paint already shows the user's last input — no flash where the
// SSR-default value is briefly visible before an effect swaps it in.
// SSR has no `window`, so the server falls back to `initial`.
export function usePersistedState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) return JSON.parse(raw) as T;
    } catch {
      // ignore
    }
    return initial;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore
    }
  }, [key, value]);

  return [value, setValue] as const;
}

export function clearPersisted(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}
