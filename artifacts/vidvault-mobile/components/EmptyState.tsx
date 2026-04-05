import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useColors } from "@/hooks/useColors";
import { AppButton } from "@/components/ui/AppButton";

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
  const accentColor = "#818cf8";

  return (
    <View style={styles.container}>
      <Text style={[styles.bigCode, { color: isDark ? "rgba(129,140,248,0.06)" : "rgba(129,140,248,0.08)" }]}>
        {code}
      </Text>

      <View style={[styles.iconBox, {
        borderColor: isDark ? "rgba(129,140,248,0.28)" : "rgba(129,140,248,0.22)",
        backgroundColor: isDark ? "rgba(129,140,248,0.08)" : "rgba(129,140,248,0.07)",
      }]}>
        <Text style={[styles.bracket, { color: isDark ? "rgba(129,140,248,0.45)" : "rgba(129,140,248,0.4)" }]}>{"["}</Text>
        <Feather name={icon} size={32} color={accentColor} />
        <Text style={[styles.bracket, { color: isDark ? "rgba(129,140,248,0.45)" : "rgba(129,140,248,0.4)" }]}>{"]"}</Text>
      </View>

      <Text style={[styles.codeLabel, { color: colors.mutedForeground }]}>// VAULT_EMPTY</Text>

      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>

      {subtitle ? (
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>
      ) : null}

      {actionLabel && onAction ? (
        <AppButton
          label={actionLabel.toUpperCase()}
          icon="plus"
          size="md"
          variant="primary"
          onPress={onAction}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 56,
    paddingHorizontal: 32,
  },
  bigCode: {
    position: "absolute",
    top: 8,
    fontSize: 130,
    fontFamily: "Raleway_900Black",
    letterSpacing: -6,
    lineHeight: 130,
  },
  iconBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderRadius: 6,
    marginBottom: 18,
    marginTop: 16,
  },
  bracket: {
    fontSize: 26,
    fontFamily: "JetBrainsMono_400Regular",
    lineHeight: 32,
  },
  codeLabel: {
    fontSize: 10,
    fontFamily: "JetBrainsMono_400Regular",
    letterSpacing: 2,
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontFamily: "Raleway_900Black",
    textAlign: "center",
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
});
