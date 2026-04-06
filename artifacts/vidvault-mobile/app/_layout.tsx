import "../global.css";
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
} from "@expo-google-fonts/poppins";
import {
  AlegreyaSansSC_400Regular,
  AlegreyaSansSC_700Bold,
  AlegreyaSansSC_800ExtraBold,
  AlegreyaSansSC_900Black,
} from "@expo-google-fonts/alegreya-sans-sc";
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_600SemiBold,
} from "@expo-google-fonts/jetbrains-mono";
import { useFonts } from "expo-font";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Platform, View, Text, Dimensions, StyleSheet, StatusBar } from "react-native";
import Svg, { Line } from "react-native-svg";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { setApiToken, setOnUnauthorized } from "@/services/api";
import { VidVaultLogo } from "@/components/VidVaultLogo";

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

function RootLayoutNav() {
  const { user, isLoading, token, logout } = useAuth();

  useEffect(() => {
    setApiToken(token);
    // Clear cached queries when the session changes so a new user never sees
    // stale data from a previous session.
    queryClient.clear();
  }, [token]);

  useEffect(() => {
    setOnUnauthorized(() => {
      logout().catch(console.warn);
    });
    return () => setOnUnauthorized(null);
  }, [logout]);

  useEffect(() => {
    if (isLoading) return;
    if (user) {
      router.replace("/(tabs)");
    } else {
      if (Platform.OS === "web") {
        router.replace("/login");
        return;
      }
      router.replace("/splash");
    }
  }, [user, isLoading]);

  if (isLoading) {
    const { width: W, height: H } = Dimensions.get("window");
    const CELL = 52;
    const cols = Math.ceil(W / CELL) + 1;
    const rows = Math.ceil(H / CELL) + 1;
    return (
      <View style={{ flex: 1, backgroundColor: "#0a0a0f", alignItems: "center", justifyContent: "center" }}>
        <Svg width={W} height={H} style={StyleSheet.absoluteFillObject}>
          {Array.from({ length: cols }).map((_, i) => (
            <Line key={`v${i}`} x1={i * CELL} y1={0} x2={i * CELL} y2={H} stroke="rgba(255,255,255,0.035)" strokeWidth={1} />
          ))}
          {Array.from({ length: rows }).map((_, i) => (
            <Line key={`h${i}`} x1={0} y1={i * CELL} x2={W} y2={i * CELL} stroke="rgba(255,255,255,0.035)" strokeWidth={1} />
          ))}
        </Svg>
        <View style={{ marginBottom: 20 }}>
          <VidVaultLogo size={88} />
        </View>
        <Text style={{ fontFamily: "AlegreyaSansSC_800ExtraBold", fontSize: 26, color: "#ffffff", letterSpacing: -0.5 }}>VidVault</Text>
        <Text style={{ fontFamily: "JetBrainsMono_400Regular", fontSize: 9, color: "#555566", letterSpacing: 3, marginTop: 4 }}>AI KNOWLEDGE VAULT</Text>
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

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    AlegreyaSansSC_400Regular,
    AlegreyaSansSC_700Bold,
    AlegreyaSansSC_800ExtraBold,
    AlegreyaSansSC_900Black,
    JetBrainsMono_400Regular,
    JetBrainsMono_600SemiBold,
  });

  const [fontTimeout, setFontTimeout] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFontTimeout(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  const fontsReady = fontsLoaded || fontError || fontTimeout;

  if (!fontsReady) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0a0a0f", alignItems: "center", justifyContent: "center" }}>
        <View style={{ marginBottom: 16 }}>
          <VidVaultLogo size={72} />
        </View>
        <Text style={{ fontSize: 24, color: "#ffffff", fontWeight: "900", letterSpacing: -0.5 }}>VidVault</Text>
        <Text style={{ fontSize: 9, color: "#555566", letterSpacing: 3, marginTop: 4 }}>AI KNOWLEDGE VAULT</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      {Platform.OS === "android" && (
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      )}
      <ErrorBoundary>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister: asyncStoragePersister }}
        >
          <GestureHandlerRootView style={{ flex: 1 }}>
            {Platform.OS === "web" ? (
              <ThemeProvider>
                <AuthProvider>
                  <RootLayoutNav />
                </AuthProvider>
              </ThemeProvider>
            ) : (
              <KeyboardProvider>
                <ThemeProvider>
                  <AuthProvider>
                    <RootLayoutNav />
                  </AuthProvider>
                </ThemeProvider>
              </KeyboardProvider>
            )}
          </GestureHandlerRootView>
        </PersistQueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
