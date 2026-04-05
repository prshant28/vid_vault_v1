import { useThemeContext } from "@/contexts/ThemeContext";

export type { ThemePreference } from "@/contexts/ThemeContext";

export function useThemeToggle() {
  const { preference, setTheme } = useThemeContext();
  return { preference, setTheme };
}
