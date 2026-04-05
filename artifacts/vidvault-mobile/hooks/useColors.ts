import colors from "@/constants/colors";
import { useThemeContext } from "@/contexts/ThemeContext";

type Palette = typeof colors.light;

export function useColors(): Palette & { radius: number } {
  const { colorScheme } = useThemeContext();
  const palette: Palette = colorScheme === "dark" ? colors.dark : colors.light;
  return { ...palette, radius: colors.radius };
}

export function useTheme() {
  const { colorScheme } = useThemeContext();
  const isDark = colorScheme === "dark";
  const palette: Palette = isDark ? colors.dark : colors.light;
  return { colors: { ...palette, radius: colors.radius }, isDark };
}
