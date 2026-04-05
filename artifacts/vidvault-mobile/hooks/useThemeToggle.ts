import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Appearance } from "react-native";

const THEME_KEY = "vidvault_theme_preference";

export type ThemePreference = "system" | "light" | "dark";

function setColorSchemeSafe(scheme: "light" | "dark" | null) {
  try {
    if (typeof Appearance.setColorScheme === "function") {
      Appearance.setColorScheme(scheme);
    }
  } catch {
    // Appearance.setColorScheme not supported on this platform (e.g. React Native Web)
  }
}

export function useThemeToggle() {
  const [preference, setPreference] = useState<ThemePreference>("dark");

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((stored) => {
      if (stored === "light" || stored === "dark" || stored === "system") {
        setPreference(stored);
        if (stored !== "system") {
          setColorSchemeSafe(stored);
        }
      }
    });
  }, []);

  const setTheme = useCallback(async (theme: ThemePreference) => {
    await AsyncStorage.setItem(THEME_KEY, theme);
    setPreference(theme);
    if (theme === "system") {
      setColorSchemeSafe(null);
    } else {
      setColorSchemeSafe(theme);
    }
  }, []);

  return { preference, setTheme };
}
