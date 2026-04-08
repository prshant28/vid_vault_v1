import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import React, { useRef, useEffect } from "react";
import { Platform, StyleSheet, View, Text, TouchableOpacity, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

import { useColors } from "@/hooks/useColors";
import { useThemeContext } from "@/contexts/ThemeContext";

const INDIGO = "#6366f1";

type FeatherName = React.ComponentProps<typeof Feather>["name"];

type TabDef = { name: string; title: string; icon: FeatherName; sfDefault: string; sfSelected: string };

const TABS: TabDef[] = [
  { name: "index",     title: "Home",     icon: "home",    sfDefault: "house",         sfSelected: "house.fill"         },
  { name: "videos",    title: "Videos",   icon: "film",    sfDefault: "film",          sfSelected: "film.fill"          },
  { name: "ai-studio", title: "AI",       icon: "cpu",     sfDefault: "sparkles",      sfSelected: "sparkles"           },
  { name: "discover",  title: "Discover", icon: "compass", sfDefault: "safari",        sfSelected: "safari.fill"        },
  { name: "profile",   title: "Profile",  icon: "user",    sfDefault: "person.circle", sfSelected: "person.circle.fill" },
];

/* ── Animated tab icon for the custom premium bar ── */
function PremiumTabIcon({
  name, focused, label, isDark,
}: { name: FeatherName; focused: boolean; label: string; isDark: boolean }) {
  const scale = useRef(new Animated.Value(focused ? 1.08 : 0.9)).current;
  const glow  = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: focused ? 1.08 : 0.9, useNativeDriver: true, speed: 30, bounciness: 10 }),
      Animated.timing(glow,  { toValue: focused ? 1 : 0, duration: 220, useNativeDriver: false }),
    ]).start();
  }, [focused]);

  const bgColor = glow.interpolate({ inputRange: [0, 1], outputRange: ["rgba(99,102,241,0)", "rgba(99,102,241,0.14)"] });
  const iconColor = focused ? INDIGO : (isDark ? "rgba(255,255,255,0.38)" : "rgba(0,0,0,0.38)");

  return (
    <View style={S.iconWrap}>
      {focused && (
        <MotiView
          from={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 18, stiffness: 220 }}
          style={S.activePill}
        />
      )}
      <Animated.View style={[S.iconBg, { backgroundColor: bgColor, transform: [{ scale }] }]}>
        <Feather name={name} size={22} color={iconColor} />
      </Animated.View>
      <Text style={[S.iconLabel, { color: iconColor, fontFamily: focused ? "Eczar_600SemiBold" : "Eczar_400Regular" }]}>
        {label}
      </Text>
    </View>
  );
}

/* ── Premium custom tab bar (web + Android) ── */
function PremiumTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colorScheme } = useThemeContext();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const gradColors: readonly [string, string] = isDark ? ["#09090e", "#0e0e16"] : ["#fafaff", "#f3f3fc"];

  return (
    <View style={[S.barOuter, { paddingBottom: insets.bottom || 8 }]}>
      <LinearGradient colors={gradColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={[S.topLine, { backgroundColor: isDark ? "#ffffff12" : "#00000012" }]} />
      <View style={S.barRow}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          if (options.href === null) return null;
          const tab = TABS.find(t => t.name === route.name);
          if (!tab) return null;
          const focused = state.index === index;
          return (
            <TouchableOpacity
              key={route.key}
              onPress={() => {
                const e = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
                if (!focused && !e.defaultPrevented) navigation.navigate(route.name);
              }}
              activeOpacity={0.8}
              style={S.tabItem}
            >
              <PremiumTabIcon name={tab.icon} focused={focused} label={tab.title} isDark={isDark} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

/* ── iOS native tab (SymbolView + BlurView) ── */
function IOSTabLayout() {
  const colors = useColors();
  const { colorScheme } = useThemeContext();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const sceneBg = isDark ? "#09090c" : "#f5f5ff";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: sceneBg },
        tabBarActiveTintColor: INDIGO,
        tabBarInactiveTintColor: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.38)",
        tabBarStyle: {
          position: "absolute",
          backgroundColor: "transparent",
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
          height: 78 + insets.bottom,
        },
        tabBarBackground: () => (
          <BlurView intensity={100} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
        ),
        tabBarLabelStyle: {
          fontFamily: "Eczar_500Medium",
          fontSize: 9,
          letterSpacing: 0.2,
          marginTop: 2,
        },
      }}
    >
      {TABS.map(({ name, title, sfDefault, sfSelected }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ color, focused }) => (
              <SymbolView name={(focused ? sfSelected : sfDefault) as any} tintColor={color} size={24} />
            ),
          }}
        />
      ))}
      <Tabs.Screen name="folders" options={{ href: null }} />
    </Tabs>
  );
}

/* ── Android / Web premium tab ── */
function PremiumTabLayout() {
  const { colorScheme } = useThemeContext();
  const sceneBg = colorScheme === "dark" ? "#09090c" : "#f5f5ff";
  return (
    <Tabs
      tabBar={(props) => <PremiumTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: sceneBg } }}
    >
      {TABS.map(({ name, title }) => (
        <Tabs.Screen key={name} name={name} options={{ title }} />
      ))}
      <Tabs.Screen name="folders" options={{ href: null }} />
    </Tabs>
  );
}

function NativeTabLayout() {
  return (
    <NativeTabs>
      {TABS.map(({ name, title, sfDefault, sfSelected }) => (
        <NativeTabs.Trigger key={name} name={name}>
          <Icon sf={{ default: sfDefault, selected: sfSelected }} />
          <Label>{title}</Label>
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) return <NativeTabLayout />;
  if (Platform.OS === "ios")    return <IOSTabLayout />;
  return <PremiumTabLayout />;
}

const S = StyleSheet.create({
  barOuter: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    overflow: "hidden",
  },
  topLine: {
    height: StyleSheet.hairlineWidth,
  },
  barRow: {
    flexDirection: "row",
    paddingTop: 6,
    paddingBottom: 2,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrap: {
    alignItems: "center",
    gap: 2,
    paddingTop: 8,
  },
  activePill: {
    position: "absolute",
    top: 0,
    width: 28, height: 3,
    borderRadius: 2,
    backgroundColor: INDIGO,
  },
  iconBg: {
    width: 44, height: 36,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  iconLabel: {
    fontSize: 9,
    letterSpacing: 0.3,
  },
});
