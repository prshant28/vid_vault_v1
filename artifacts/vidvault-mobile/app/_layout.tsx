import "../global.css";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_900Black,
  useFonts,
} from "@expo-google-fonts/inter";
import {
  Raleway_700Bold,
  Raleway_900Black,
} from "@expo-google-fonts/raleway";
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_600SemiBold,
} from "@expo-google-fonts/jetbrains-mono";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Appearance, Platform, View, Image, Text, Dimensions } from "react-native";
import Svg, { Line } from "react-native-svg";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { setApiToken } from "@/services/api";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 60 * 24,
    },
  },
});

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "vidvault_query_cache",
  throttleTime: 1000,
});

const ONBOARDING_KEY = "vidvault_onboarding_done";
const THEME_KEY = "vidvault_theme_preference";

function RootLayoutNav() {
  const { user, isLoading, token } = useAuth();

  useEffect(() => {
    setApiToken(token);
  }, [token]);

  useEffect(() => {
    if (isLoading) return;
    if (user) {
      router.replace("/(tabs)");
    } else {
      if (Platform.OS === "web") {
        router.replace("/login");
        return;
      }
      // On native show splash → onboarding or login
      router.replace("/splash");
    }
  }, [user, isLoading]);

  // While auth state is being restored from storage, show a branded loading screen
  // so the home tab never flashes before the correct route is pushed.
  if (isLoading) {
    const { width: W, height: H } = Dimensions.get("window");
    const CELL = 52;
    const cols = Math.ceil(W / CELL) + 1;
    const rows = Math.ceil(H / CELL) + 1;
    return (
      <View style={{ flex: 1, backgroundColor: "#0a0a0b", alignItems: "center", justifyContent: "center" }}>
        {/* Grid background */}
        <Svg width={W} height={H} style={{ position: "absolute" }}>
          {Array.from({ length: cols }).map((_, i) => (
            <Line key={`v${i}`} x1={i * CELL} y1={0} x2={i * CELL} y2={H} stroke="rgba(139,92,246,0.07)" strokeWidth={1} />
          ))}
          {Array.from({ length: rows }).map((_, i) => (
            <Line key={`h${i}`} x1={0} y1={i * CELL} x2={W} y2={i * CELL} stroke="rgba(139,92,246,0.07)" strokeWidth={1} />
          ))}
        </Svg>
        {/* Logo ring */}
        <View style={{ width: 90, height: 90, borderRadius: 4, borderWidth: 1, borderColor: "rgba(139,92,246,0.3)", backgroundColor: "rgba(139,92,246,0.07)", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
          <Image source={require("@/assets/images/logo.png")} style={{ width: 62, height: 62 }} resizeMode="contain" />
        </View>
        <Text style={{ fontFamily: "Raleway_900Black", fontSize: 28, color: "#ffffff", letterSpacing: -0.5 }}>VidVault</Text>
        <Text style={{ fontFamily: "JetBrainsMono_400Regular", fontSize: 9, color: "#555566", letterSpacing: 3, marginTop: 6 }}>AI KNOWLEDGE VAULT</Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="splash" options={{ headerShown: false, animation: "none" }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false, animation: "fade" }} />
      <Stack.Screen name="login" options={{ headerShown: false, animation: "fade" }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="video/[id]" options={{ headerShown: false, animation: "slide_from_right" }} />
      <Stack.Screen name="folder/[id]" options={{ headerShown: false, animation: "slide_from_right" }} />
    </Stack>
  );
}

function ThemeInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((stored) => {
      if (stored === "light" || stored === "dark") {
        Appearance.setColorScheme(stored);
      } else if (stored === "system") {
        Appearance.setColorScheme(null);
      }
    });
  }, []);
  return <>{children}</>;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_900Black,
    Raleway_700Bold,
    Raleway_900Black,
    JetBrainsMono_400Regular,
    JetBrainsMono_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister: asyncStoragePersister }}
        >
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <AuthProvider>
                <ThemeInitializer>
                  <RootLayoutNav />
                </ThemeInitializer>
              </AuthProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </PersistQueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
