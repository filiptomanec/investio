import { useEffect, useRef, useState } from "react";

// Persists state in localStorage under a stable key. SSR-safe: starts with
// `initial`, hydrates from storage on mount.
export function usePersistedState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const hydrated = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) setValue(JSON.parse(raw) as T);
    } catch {
      // ignore
    }
    hydrated.current = true;
  }, [key]);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
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
