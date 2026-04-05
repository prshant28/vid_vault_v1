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
  onRightPress?: () => void;
  rightIcon?: string;
  transparent?: boolean;
}

export function TopAppBar({
  title,
  showBack = false,
  rightAction,
  onRightPress,
  rightIcon,
  transparent = false,
}: TopAppBarProps) {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const PURPLE = colors.primary;

  const topPad = Platform.OS === "web" ? 12 : insets.top + 4;

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
      {/* Left */}
      <View style={styles.side}>
        {showBack ? (
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} activeOpacity={0.75}>
            <Feather name="arrow-left" size={20} color={colors.foreground} />
          </TouchableOpacity>
        ) : (
          <View style={styles.logoRow}>
            <View style={[styles.logoBox, { borderColor: PURPLE + "40", backgroundColor: PURPLE + "12" }]}>
              <Image
                source={require("@/assets/images/logo.png")}
                style={styles.logoImg}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.brandText, { color: colors.foreground }]}>
              VidVault
            </Text>
            <View style={[styles.aiBadge, { backgroundColor: PURPLE + "18", borderColor: PURPLE + "35" }]}>
              <Text style={[styles.aiBadgeText, { color: PURPLE }]}>AI</Text>
            </View>
          </View>
        )}
      </View>

      {/* Center title (only when showBack) */}
      {showBack && title ? (
        <Text
          style={[styles.centerTitle, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {title}
        </Text>
      ) : (
        <View style={{ flex: 1 }} />
      )}

      {/* Right */}
      <View style={[styles.side, { alignItems: "flex-end" }]}>
        {rightAction ?? (
          onRightPress && rightIcon ? (
            <TouchableOpacity onPress={onRightPress} style={styles.iconBtn} activeOpacity={0.75}>
              <Feather name={rightIcon as any} size={20} color={colors.foreground} />
            </TouchableOpacity>
          ) : (
            <View style={styles.rightDefault}>
              <TouchableOpacity style={[styles.iconBtn, { marginRight: 2 }]} activeOpacity={0.75}>
                <Feather name="search" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} activeOpacity={0.75}>
                <View style={[styles.notifDot, { backgroundColor: PURPLE }]} />
                <Feather name="bell" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          )
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 10,
  },
  side: {
    width: 120,
    flexDirection: "row",
    alignItems: "center",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoImg: {
    width: 22,
    height: 22,
  },
  brandText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 17,
    letterSpacing: -0.3,
  },
  aiBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  aiBadgeText: {
    fontFamily: "JetBrainsMono_600SemiBold",
    fontSize: 9,
    letterSpacing: 0.5,
  },
  centerTitle: {
    flex: 1,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    textAlign: "center",
    letterSpacing: -0.2,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  rightDefault: {
    flexDirection: "row",
    alignItems: "center",
  },
  notifDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    zIndex: 1,
  },
});
