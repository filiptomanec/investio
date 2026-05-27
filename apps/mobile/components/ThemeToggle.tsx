import { Pressable } from "react-native";
import { Moon, Sun } from "lucide-react-native";
import { selectionFeedback } from "../lib/haptics";
import type { Theme } from "../lib/tokens";

interface ThemeToggleProps {
  theme: Theme;
  onToggle: () => void;
  iconColor: string;
}

export function ThemeToggle({ theme, onToggle, iconColor }: ThemeToggleProps) {
  return (
    <Pressable
      onPress={() => {
        selectionFeedback();
        onToggle();
      }}
      className="w-9 h-9 items-center justify-center rounded-lg border border-border bg-card"
      accessibilityRole="button"
      accessibilityLabel="Toggle theme"
      accessibilityHint={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      style={{ minWidth: 44, minHeight: 44 }}
    >
      {theme === "dark" ? (
        <Sun size={16} color={iconColor} />
      ) : (
        <Moon size={16} color={iconColor} />
      )}
    </Pressable>
  );
}
