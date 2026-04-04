import { useColorScheme } from "react-native";
import colors from "@/constants/colors";

type Palette = typeof colors.light;

export function useColors(): Palette & { radius: number } {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const palette: Palette = isDark ? colors.dark : colors.light;
  return { ...palette, radius: colors.radius };
}

export function useTheme() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const palette: Palette = isDark ? colors.dark : colors.light;
  return { colors: { ...palette, radius: colors.radius }, isDark };
}
