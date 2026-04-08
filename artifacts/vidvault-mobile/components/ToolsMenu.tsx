import React, { useEffect, useRef } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  ScrollView, Animated, Platform, Pressable, useWindowDimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

const PURPLE = "#6366f1";
const CYAN   = "#06b6d4";
const GREEN  = "#10b981";
const AMBER  = "#f59e0b";
const PINK   = "#ec4899";
const BLUE   = "#3b82f6";

interface ToolEntry {
  id: string;
  label: string;
  icon: string;
  color: string;
  route?: string;
  action?: string;
}

const ALL_TOOLS: ToolEntry[] = [
  { id: "videos",     label: "Videos",        icon: "film",       color: PURPLE,  route: "/(tabs)/videos" },
  { id: "ai-studio",  label: "AI Studio",     icon: "cpu",        color: CYAN,    route: "/(tabs)/ai-studio" },
  { id: "folders",    label: "Folders",       icon: "folder",     color: AMBER,   route: "/(tabs)/folders" },
  { id: "search",     label: "Search",        icon: "search",     color: BLUE,    route: "/search" },
  { id: "sr-review",  label: "SR Review",     icon: "layers",     color: GREEN,   route: "/review" },
  { id: "watch-later",label: "Watch Later",   icon: "clock",      color: AMBER,   route: "/watch-later" },
  { id: "key-terms",  label: "Key Terms",     icon: "book",       color: PINK,    route: "/key-terms" },
  { id: "cross-ai",   label: "Cross Vault",   icon: "share-2",    color: CYAN,    route: "/cross-video-ai" },
  { id: "chat-hist",  label: "Chat History",  icon: "message-square", color: PURPLE, route: "/chat-history" },
  { id: "study-plan", label: "Study Plan",    icon: "calendar",   color: GREEN,   action: "coming-soon" },
  { id: "playlist",   label: "Playlists",     icon: "play-circle",color: PINK,    route: "/(tabs)/folders" },
  { id: "discover",   label: "Discover",      icon: "compass",    color: BLUE,    route: "/(tabs)/discover" },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  onImportPress?: () => void;
}

export function ToolsMenu({ visible, onClose, onImportPress }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;

  const panelWidth = screenWidth - 24;
  const cellWidth = Math.floor((panelWidth - 20 - 16) / 3);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(fadeAnim, { toValue: 1, useNativeDriver: true, tension: 100, friction: 10 }),
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 100, friction: 10 }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: -20, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleTool = (tool: ToolEntry) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    if (tool.action === "coming-soon") {
      setTimeout(() => {
        const { Alert } = require("react-native");
        Alert.alert("Coming Soon", `${tool.label} is coming in a future update.`);
      }, 300);
      return;
    }
    if (tool.route) {
      setTimeout(() => router.push(tool.route as any), 100);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: fadeAnim }]}
        />
      </Pressable>

      {/* Panel */}
      <Animated.View
        style={[
          styles.panel,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            marginTop: insets.top + (Platform.OS === "web" ? 12 : 60),
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
        pointerEvents="box-none"
      >
        <LinearGradient
          colors={[PURPLE + "0a", "transparent"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: 18 }]}
          pointerEvents="none"
        />

        {/* Header */}
        <View style={styles.panelHeader}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={[styles.panelHeaderIcon, { backgroundColor: PURPLE + "18", borderColor: PURPLE + "30" }]}>
              <Feather name="grid" size={13} color={PURPLE} />
            </View>
            <Text style={[styles.panelTitle, { color: colors.foreground }]}>All Tools</Text>
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="x" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* Import shortcut */}
        {onImportPress && (
          <TouchableOpacity
            onPress={() => { onClose(); setTimeout(() => onImportPress?.(), 200); }}
            style={[styles.importShortcut, { backgroundColor: PURPLE + "12", borderColor: PURPLE + "30" }]}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[PURPLE + "18", "transparent"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[StyleSheet.absoluteFill, { borderRadius: 10 }]}
              pointerEvents="none"
            />
            <View style={[styles.importShortcutIcon, { backgroundColor: PURPLE + "20" }]}>
              <Feather name="zap" size={14} color={PURPLE} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.importShortcutTitle, { color: PURPLE }]}>Smart Import</Text>
              <Text style={[styles.importShortcutSub, { color: colors.mutedForeground }]}>
                AI saves, tags & organizes any URL
              </Text>
            </View>
            <Feather name="arrow-right" size={14} color={PURPLE + "80"} />
          </TouchableOpacity>
        )}

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Tool grid — 3 exact columns */}
        <View style={styles.toolGrid}>
          {ALL_TOOLS.map((tool) => (
            <TouchableOpacity
              key={tool.id}
              onPress={() => handleTool(tool)}
              style={[styles.toolCell, { width: cellWidth, backgroundColor: tool.color + "0e", borderColor: tool.color + "25" }]}
              activeOpacity={0.72}
            >
              <View style={[styles.toolCellIcon, { backgroundColor: tool.color + "18" }]}>
                <Feather name={tool.icon as any} size={15} color={tool.color} />
              </View>
              <Text style={[styles.toolCellLabel, { color: colors.foreground }]} numberOfLines={1}>
                {tool.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  panel: {
    position: "absolute",
    top: 0,
    left: 12,
    right: 12,
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 20,
    zIndex: 1000,
  },
  panelHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10,
  },
  panelHeaderIcon: {
    width: 28, height: 28, borderRadius: 8, alignItems: "center",
    justifyContent: "center", borderWidth: 1,
  },
  panelTitle: { fontFamily: "AlegreyaSansSC_700Bold", fontSize: 16 },
  importShortcut: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginHorizontal: 12, borderRadius: 10, borderWidth: 1, padding: 11,
    overflow: "hidden", marginBottom: 8,
  },
  importShortcutIcon: {
    width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center",
  },
  importShortcutTitle: { fontFamily: "Eczar_700Bold", fontSize: 13 },
  importShortcutSub: { fontFamily: "Eczar_400Regular", fontSize: 10, lineHeight: 14, marginTop: 1 },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 12, marginBottom: 10 },
  toolGrid: {
    flexDirection: "row", flexWrap: "wrap",
    paddingHorizontal: 10, paddingBottom: 14, gap: 8,
  },
  toolCell: {
    borderRadius: 12, borderWidth: 1,
    alignItems: "center", paddingVertical: 12, gap: 6,
  },
  toolCellIcon: {
    width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center",
  },
  toolCellLabel: { fontFamily: "Eczar_600SemiBold", fontSize: 10, textAlign: "center" },
});
