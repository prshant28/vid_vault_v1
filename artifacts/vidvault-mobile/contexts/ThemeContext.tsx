import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ColorScheme = "light" | "dark";
export type ThemePreference = "light" | "dark" | "system";

interface ThemeContextValue {
  colorScheme: ColorScheme;
  preference: ThemePreference;
  setTheme: (theme: ThemePreference) => Promise<void>;
}

const THEME_KEY = "vidvault_theme_preference";

const ThemeContext = createContext<ThemeContextValue>({
  colorScheme: "dark",
  preference: "dark",
  setTheme: async () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference>("dark");
  const [colorScheme, setColorScheme] = useState<ColorScheme>("dark");

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((stored) => {
      if (stored === "light" || stored === "dark" || stored === "system") {
        setPreference(stored);
        setColorScheme(stored === "system" ? "dark" : stored);
      }
    });
  }, []);

  const setTheme = useCallback(async (theme: ThemePreference) => {
    await AsyncStorage.setItem(THEME_KEY, theme);
    setPreference(theme);
    setColorScheme(theme === "system" ? "dark" : theme);
  }, []);

  return (
    <ThemeContext.Provider value={{ colorScheme, preference, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext(): ThemeContextValue {
  return useContext(ThemeContext);
}
