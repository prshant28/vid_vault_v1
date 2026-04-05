import React, { useEffect } from "react";
import { View, Image, Text, StyleSheet, Dimensions } from "react-native";
import { MotiView } from "moti";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ONBOARDING_KEY = "vidvault_onboarding_done";

const { width } = Dimensions.get("window");

const BG = "#0a0a0b";
const PURPLE = "#8b5cf6";
const MUTED = "#3a3a4a";
const WHITE = "#ffffff";

export default function SplashScreen() {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const timer = setTimeout(async () => {
      const done = await AsyncStorage.getItem(ONBOARDING_KEY);
      if (!done) {
        router.replace("/onboarding");
      } else {
        router.replace("/login");
      }
    }, 2600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Background grid dots */}
      <View style={[StyleSheet.absoluteFillObject, { pointerEvents: "none" }]}>
        {Array.from({ length: 80 }).map((_, i) => {
          const col = i % 10;
          const row = Math.floor(i / 10);
          return (
            <View
              key={i}
              style={[
                styles.gridDot,
                {
                  left: col * (width / 10) + (width / 20),
                  top: row * 80 + 40,
                  opacity: 0.04 + (col % 3) * 0.01,
                },
              ]}
            />
          );
        })}
      </View>

      {/* Corner accent lines */}
      <View style={[styles.cornerTL, { borderColor: PURPLE + "30" }]} />
      <View style={[styles.cornerBR, { borderColor: PURPLE + "30" }]} />

      {/* Logo + name block */}
      <MotiView
        from={{ opacity: 0, scale: 0.72 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 16, stiffness: 120 }}
        style={styles.centerBlock}
      >
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: "timing", duration: 500 }}
          style={styles.logoRing}
        >
          <Image
            source={require("@/assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 600, delay: 300 }}
          style={styles.titleBlock}
        >
          <Text style={styles.appName}>VidVault</Text>
          <Text style={styles.tagline}>AI KNOWLEDGE VAULT</Text>
        </MotiView>
      </MotiView>

      {/* Loading bar */}
      <View style={styles.barTrack}>
        <MotiView
          from={{ width: 0, opacity: 0.4 }}
          animate={{ width: 100, opacity: 1 }}
          transition={{ type: "timing", duration: 2000, delay: 500 }}
          style={styles.barFill}
        />
      </View>

      {/* Version badge */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: "timing", duration: 500, delay: 800 }}
        style={styles.versionBadge}
      >
        <Text style={styles.versionText}>v1.0</Text>
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    alignItems: "center",
    justifyContent: "center",
  },
  gridDot: {
    position: "absolute",
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: WHITE,
  },
  cornerTL: {
    position: "absolute",
    top: 48,
    left: 24,
    width: 40,
    height: 40,
    borderTopWidth: 1,
    borderLeftWidth: 1,
  },
  cornerBR: {
    position: "absolute",
    bottom: 60,
    right: 24,
    width: 40,
    height: 40,
    borderBottomWidth: 1,
    borderRightWidth: 1,
  },
  centerBlock: {
    alignItems: "center",
    gap: 28,
  },
  logoRing: {
    width: 110,
    height: 110,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.2)",
    backgroundColor: "rgba(139,92,246,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 76,
    height: 76,
  },
  titleBlock: {
    alignItems: "center",
    gap: 8,
  },
  appName: {
    fontFamily: "Poppins_900Black",
    fontSize: 42,
    color: WHITE,
    letterSpacing: -1,
    lineHeight: 46,
  },
  tagline: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 10,
    color: MUTED,
    letterSpacing: 3.5,
  },
  barTrack: {
    position: "absolute",
    bottom: 80,
    width: 100,
    height: 2,
    backgroundColor: "rgba(139,92,246,0.15)",
    borderRadius: 1,
    overflow: "hidden",
  },
  barFill: {
    height: 2,
    backgroundColor: PURPLE,
    borderRadius: 1,
  },
  versionBadge: {
    position: "absolute",
    bottom: 56,
  },
  versionText: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 10,
    color: MUTED,
    letterSpacing: 1,
  },
});
