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

const PURPLE = "#8b5cf6";

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

  /* Exactly match safe-area top — Dynamic Island aware on iOS */
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
      {/* Left */}
      <View style={styles.side}>
        {showBack ? (
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.badgeBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
            activeOpacity={0.75}
          >
            <Feather name="arrow-left" size={16} color={colors.foreground} />
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
            <Text style={[styles.brandText, { color: colors.foreground }]}>VidVault</Text>
          </View>
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
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 10,
  },
  side: {
    width: 130,
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
    borderRadius: 6,
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
    paddingHorizontal: 6,
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
  /* Badge-style button — matches login "SIGN_IN" badge */
  badgeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    position: "relative",
  },
  rightDefault: {
    flexDirection: "row",
    alignItems: "center",
  },
  notifDot: {
    position: "absolute",
    top: 5,
    right: 6,
    width: 5,
    height: 5,
    borderRadius: 3,
    zIndex: 1,
  },
});
