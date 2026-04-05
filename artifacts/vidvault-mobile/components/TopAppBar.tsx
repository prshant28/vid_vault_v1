import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useColors } from "@/hooks/useColors";

interface TopAppBarProps {
  title?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  transparent?: boolean;
}

export function TopAppBar({
  title,
  showBack = false,
  rightAction,
  transparent = false,
}: TopAppBarProps) {
  const insets = useSafeAreaInsets();
  const colors = useColors();

  const topPad = Platform.OS === "web" ? 12 : insets.top;

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: topPad,
          backgroundColor: transparent ? "transparent" : colors.background,
          borderBottomColor: colors.border,
        },
      ]}
    >
      {/* Left: back button or brand logo */}
      <View style={styles.left}>
        {showBack ? (
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.iconBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
            activeOpacity={0.75}
          >
            <Feather name="arrow-left" size={16} color={colors.foreground} />
          </TouchableOpacity>
        ) : (
          <View style={styles.logoRow}>
            <View style={[styles.logoBox, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Image
                source={require("@/assets/images/logo.png")}
                style={styles.logoImg}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.brandText, { color: colors.foreground }]}>VidVault</Text>
          </View>
        )}
      </View>

      {/* Center: title when in detail view */}
      {showBack && title ? (
        <Text style={[styles.centerTitle, { color: colors.foreground }]} numberOfLines={1}>
          {title}
        </Text>
      ) : (
        <View style={{ flex: 1 }} />
      )}

      {/* Right: action slot */}
      <View style={styles.right}>
        {rightAction ?? null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 10,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 110,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    minWidth: 80,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoBox: {
    width: 30,
    height: 30,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoImg: {
    width: 20,
    height: 20,
  },
  brandText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    letterSpacing: -0.3,
  },
  iconBtn: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 6,
    width: 34,
    height: 34,
  },
  centerTitle: {
    flex: 1,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    textAlign: "center",
    letterSpacing: -0.2,
    paddingHorizontal: 8,
  },
});
