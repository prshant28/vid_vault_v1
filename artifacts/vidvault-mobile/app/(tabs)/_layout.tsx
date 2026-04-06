import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useThemeContext } from "@/contexts/ThemeContext";

const INDIGO = "#6366f1";
const INDIGO_DIM = "#6366f130";

type FeatherName = React.ComponentProps<typeof Feather>["name"];

function AndroidTabIcon({
  name,
  focused,
  size = 22,
}: {
  name: FeatherName;
  focused: boolean;
  size?: number;
}) {
  return (
    <View style={styles.androidIconWrapper}>
      {focused && (
        <View style={styles.androidPill} />
      )}
      <View
        style={[
          styles.androidIconBg,
          focused && styles.androidIconBgActive,
        ]}
      >
        <Feather name={name} size={size} color={focused ? INDIGO : "rgba(255,255,255,0.38)"} />
      </View>
    </View>
  );
}

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>Home</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="videos">
        <Icon sf={{ default: "film", selected: "film.fill" }} />
        <Label>Videos</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="ai-studio">
        <Icon sf={{ default: "sparkles", selected: "sparkles" }} />
        <Label>AI Studio</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="discover">
        <Icon sf={{ default: "compass", selected: "compass.fill" }} />
        <Label>Discover</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: "person.circle", selected: "person.circle.fill" }} />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const { colorScheme } = useThemeContext();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isAndroid = Platform.OS === "android";
  const isWeb = Platform.OS === "web";
  const insets = useSafeAreaInsets();

  const androidTabBarHeight = 60 + insets.bottom;

  const androidGradient: readonly [string, string, ...string[]] = isDark
    ? ["#08080d", "#0b0b10"]
    : ["#f8f8ff", "#f0f0fa"];

  type TabDef = { name: string; title: string; icon: FeatherName; sfDefault: string; sfSelected: string };
  const TABS: TabDef[] = [
    { name: "index",     title: "Home",      icon: "home",    sfDefault: "house",            sfSelected: "house.fill"            },
    { name: "videos",    title: "Videos",    icon: "film",    sfDefault: "film",             sfSelected: "film.fill"             },
    { name: "ai-studio", title: "AI Studio", icon: "cpu",     sfDefault: "sparkles",         sfSelected: "sparkles"              },
    { name: "discover",  title: "Discover",  icon: "compass", sfDefault: "compass",          sfSelected: "compass.fill"          },
    { name: "profile",   title: "Profile",   icon: "user",    sfDefault: "person.circle",    sfSelected: "person.circle.fill"    },
  ];

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: INDIGO,
          tabBarInactiveTintColor: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.38)",
          headerShown: false,

          tabBarStyle: isAndroid
            ? {
                position: "absolute",
                height: androidTabBarHeight,
                backgroundColor: "transparent",
                borderTopWidth: 0,
                elevation: 0,
              }
            : {
                position: "absolute",
                backgroundColor: isIOS ? "transparent" : colors.tabBar,
                borderTopWidth: isWeb ? 1 : StyleSheet.hairlineWidth,
                borderTopColor: colors.border,
                elevation: 0,
                ...(isWeb ? { height: 84 } : {}),
              },

          tabBarBackground: () =>
            isAndroid ? (
              <>
                {/* Top accent line — pointerEvents as prop for Android */}
                <View
                  pointerEvents="none"
                  style={[
                    StyleSheet.absoluteFillObject,
                    { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: isDark ? "#ffffff14" : "#00000018" },
                  ]}
                />
                <LinearGradient
                  colors={androidGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
              </>
            ) : isIOS ? (
              <BlurView
                intensity={100}
                tint={isDark ? "dark" : "light"}
                style={StyleSheet.absoluteFill}
              />
            ) : (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.tabBar }]} />
            ),

          tabBarLabelStyle: isAndroid
            ? {
                fontFamily: "Poppins_600SemiBold",
                fontSize: 9,
                letterSpacing: 0.3,
                marginTop: -2,
                textTransform: "uppercase",
              }
            : {
                fontFamily: "Poppins_500Medium",
                fontSize: 9,
                letterSpacing: 0.2,
                marginTop: 2,
              },

          tabBarItemStyle: isAndroid
            ? { paddingTop: 6, paddingBottom: insets.bottom > 0 ? 0 : 4 }
            : {},
          tabBarPressColor: isAndroid ? INDIGO + "22" : undefined,
        }}
      >
        {TABS.map(({ name, title, icon, sfDefault, sfSelected }) => (
          <Tabs.Screen
            key={name}
            name={name}
            options={{
              title,
              tabBarIcon: ({ color, focused }) =>
                isIOS ? (
                  <SymbolView name={(focused ? sfSelected : sfDefault) as any} tintColor={color} size={24} />
                ) : (
                  <AndroidTabIcon name={icon} focused={focused} />
                ),
            }}
          />
        ))}
      </Tabs>
    </>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}

const styles = StyleSheet.create({
  androidIconWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: 48,
    height: 40,
  },
  androidPill: {
    position: "absolute",
    top: 0,
    width: 36,
    height: 3,
    borderRadius: 2,
    backgroundColor: INDIGO,
  },
  androidIconBg: {
    width: 40,
    height: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    backgroundColor: "transparent",
  },
  androidIconBgActive: {
    backgroundColor: INDIGO_DIM,
  },
});
