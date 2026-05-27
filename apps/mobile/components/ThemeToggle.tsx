/**
 * ThemeToggle — matches web exactly:
 *
 *   <button className="size-9 inline-flex items-center justify-center
 *     rounded-lg border border-border bg-card hover:bg-muted transition-colors
 *     text-foreground">
 *     {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
 *   </button>
 *
 * size-9 = 36px, rounded-lg = 8px, size-4 icon = 16px.
 */
import { Pressable } from "react-native";
import { Sun, Moon } from "lucide-react-native";
import type { Theme } from "../lib/tokens";

interface ThemeToggleProps {
  theme: Theme;
  onToggle: () => void;
  colors: {
    foreground: string;
    card: string;
    border: string;
  };
}

export function ThemeToggle({ theme, onToggle, colors }: ThemeToggleProps) {
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityLabel="Toggle theme"
      style={({ pressed }) => ({
        width: 36,
        height: 36,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
        alignItems: "center",
        justifyContent: "center",
        opacity: pressed ? 0.7 : 1,
      })}
    >
      {theme === "dark" ? (
        <Sun size={16} color={colors.foreground} />
      ) : (
        <Moon size={16} color={colors.foreground} />
      )}
    </Pressable>
  );
}
