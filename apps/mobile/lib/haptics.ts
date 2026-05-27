import * as Haptics from "expo-haptics";

// Thin wrapper — keeps the import localized so if we ever share this file
// with a web/SSR environment the import can be swapped to a no-op without
// touching callers.

export function selectionFeedback(): void {
  void Haptics.selectionAsync();
}

export function impactFeedback(): void {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}
