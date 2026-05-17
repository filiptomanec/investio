import { Stack } from "expo-router";

/**
 * Auth route group layout.
 * No header shown — each screen handles its own top area.
 */
export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
