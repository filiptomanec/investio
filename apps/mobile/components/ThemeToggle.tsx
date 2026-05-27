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
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {theme === "dark" ? (
        <Sun size={16} color={colors.foreground} />
      ) : (
        <Moon size={16} color={colors.foreground} />
      )}
    </Pressable>
  );
}
