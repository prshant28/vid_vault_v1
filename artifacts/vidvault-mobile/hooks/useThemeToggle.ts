import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Appearance } from "react-native";

const THEME_KEY = "vidvault_theme_preference";

export type ThemePreference = "system" | "light" | "dark";

export function useThemeToggle() {
  const [preference, setPreference] = useState<ThemePreference>("system");

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((stored) => {
      if (stored === "light" || stored === "dark" || stored === "system") {
        setPreference(stored);
        if (stored !== "system") {
          Appearance.setColorScheme(stored);
        }
      }
    });
  }, []);

  const setTheme = useCallback(async (theme: ThemePreference) => {
    await AsyncStorage.setItem(THEME_KEY, theme);
    setPreference(theme);
    if (theme === "system") {
      Appearance.setColorScheme(null);
    } else {
      Appearance.setColorScheme(theme);
    }
  }, []);

  return { preference, setTheme };
}
