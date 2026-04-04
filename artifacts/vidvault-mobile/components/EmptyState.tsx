import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useColors } from "@/hooks/useColors";

type FeatherIconName = ComponentProps<typeof Feather>["name"];

interface EmptyStateProps {
  icon: FeatherIconName;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  code?: string;
}

export function EmptyState({ icon, title, subtitle, actionLabel, onAction, code = "00" }: EmptyStateProps) {
  const colors = useColors();

  const isDark = colors.background === "#0a0a0f" || colors.background.startsWith("#0");

  return (
    <View style={styles.container}>
      <Text style={[styles.bigCode, { color: isDark ? "rgba(139,92,246,0.05)" : "rgba(124,58,237,0.06)" }]}>
        {code}
      </Text>

      <View style={[styles.iconBox, { borderColor: isDark ? "rgba(139,92,246,0.25)" : "rgba(124,58,237,0.2)", backgroundColor: isDark ? "rgba(139,92,246,0.07)" : "rgba(124,58,237,0.06)" }]}>
        <Text style={[styles.bracket, { color: isDark ? "rgba(139,92,246,0.4)" : "rgba(124,58,237,0.35)" }]}>{"["}</Text>
        <Feather name={icon} size={28} color={isDark ? "#8b5cf6" : "#7c3aed"} />
        <Text style={[styles.bracket, { color: isDark ? "rgba(139,92,246,0.4)" : "rgba(124,58,237,0.35)" }]}>{"]"}</Text>
      </View>

      <Text style={[styles.codeLabel, { color: colors.mutedForeground }]}>// VAULT_EMPTY</Text>

      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>

      {subtitle ? (
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>
      ) : null}

      {actionLabel && onAction ? (
        <TouchableOpacity
          onPress={onAction}
          activeOpacity={0.85}
          style={[styles.actionBtn, { backgroundColor: isDark ? "#8b5cf6" : "#7c3aed" }]}
        >
          <Feather name="plus" size={14} color="#fff" />
          <Text style={styles.actionBtnText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  bigCode: {
    position: "absolute",
    top: 8,
    fontSize: 120,
    fontFamily: "Raleway_900Black",
    letterSpacing: -6,
    lineHeight: 120,
  },
  iconBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 4,
    marginBottom: 16,
    marginTop: 12,
  },
  bracket: {
    fontSize: 22,
    fontFamily: "JetBrainsMono_400Regular",
    lineHeight: 28,
  },
  codeLabel: {
    fontSize: 9,
    fontFamily: "JetBrainsMono_400Regular",
    letterSpacing: 2,
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontFamily: "Raleway_900Black",
    textAlign: "center",
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 4,
  },
  actionBtnText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
});
