import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useThemeContext } from "@/contexts/ThemeContext";
import { VidVaultLogo } from "@/components/VidVaultLogo";
import { UniversalImportModal } from "@/components/UniversalImportModal";
import { ToolsMenu } from "@/components/ToolsMenu";

const PURPLE = "#6366f1";
const CYAN   = "#06b6d4";

interface TopAppBarProps {
  title?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  transparent?: boolean;
  showImport?: boolean;
  showTools?: boolean;
}

export function TopAppBar({
  title,
  showBack = false,
  rightAction,
  transparent = false,
  showImport = false,
  showTools = false,
}: TopAppBarProps) {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { colorScheme } = useThemeContext();
  const topPad = Platform.OS === "web" ? 12 : insets.top;
  const isDark = colorScheme === "dark";

  const [importVisible, setImportVisible] = useState(false);
  const [toolsVisible, setToolsVisible] = useState(false);

  const defaultRightContent = !showBack && (showImport || showTools) ? (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      {showImport && (
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setToolsVisible(false);
            setImportVisible(true);
          }}
          style={[styles.actionBtn, { backgroundColor: PURPLE + "18", borderColor: PURPLE + "40" }]}
          activeOpacity={0.75}
        >
          <Feather name="plus" size={15} color={PURPLE} />
        </TouchableOpacity>
      )}
      {showTools && (
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setImportVisible(false);
            setToolsVisible(true);
          }}
          style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          activeOpacity={0.75}
        >
          <Feather name="grid" size={15} color={colors.foreground} />
        </TouchableOpacity>
      )}
    </View>
  ) : null;

  return (
    <>
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
        {!transparent && (
          <LinearGradient
            colors={["transparent", isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bottomLine}
            pointerEvents="none"
          />
        )}

        {/* Left */}
        <View style={styles.left}>
          {showBack ? (
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.iconBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
              activeOpacity={0.75}
            >
              <LinearGradient
                colors={["rgba(255,255,255,0.07)", "transparent"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <Feather name="arrow-left" size={16} color={colors.foreground} />
            </TouchableOpacity>
          ) : (
            <View style={styles.logoRow}>
              <VidVaultLogo size={30} />
              <View>
                <Text style={[styles.brandText, { color: colors.foreground }]}>VidVault</Text>
              </View>
            </View>
          )}
        </View>

        {/* Center */}
        {showBack && title ? (
          <Text style={[styles.centerTitle, { color: colors.foreground }]} numberOfLines={1}>
            {title}
          </Text>
        ) : (
          <View style={{ flex: 1 }} />
        )}

        {/* Right */}
        <View style={styles.right}>
          {rightAction ?? null}
          {!rightAction && defaultRightContent}
          {rightAction && (showImport || showTools) && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginLeft: 4 }}>
              {showTools && (
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setImportVisible(false);
                    setToolsVisible(true);
                  }}
                  style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                  activeOpacity={0.75}
                >
                  <Feather name="grid" size={15} color={colors.foreground} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Import Modal */}
      <UniversalImportModal
        visible={importVisible}
        onClose={() => setImportVisible(false)}
      />

      {/* Tools Menu */}
      <ToolsMenu
        visible={toolsVisible}
        onClose={() => setToolsVisible(false)}
        onImportPress={() => {
          setToolsVisible(false);
          setImportVisible(true);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    zIndex: 10,
    overflow: "visible",
  },
  bottomLine: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 120,
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
    gap: 9,
  },
  brandText: {
    fontFamily: "AlegreyaSansSC_800ExtraBold",
    fontSize: 20,
    letterSpacing: -0.3,
    lineHeight: 20,
  },
  actionBtn: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: "center", justifyContent: "center", borderWidth: 1,
  },
  iconBtn: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 10,
    width: 36,
    height: 36,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  centerTitle: {
    flex: 1,
    fontFamily: "AlegreyaSansSC_700Bold",
    fontSize: 16,
    textAlign: "center",
    letterSpacing: -0.2,
    paddingHorizontal: 8,
  },
});
