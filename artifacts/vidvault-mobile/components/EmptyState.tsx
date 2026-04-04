import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
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
}

export function EmptyState({ icon, title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  const colors = useColors();
  return (
    <View className="flex-1 items-center justify-center p-8">
      <View
        className="w-18 h-18 rounded-full items-center justify-center mb-4"
        style={{ backgroundColor: colors.accent, width: 72, height: 72, borderRadius: 36 }}
      >
        <Feather name={icon} size={28} color={colors.primary} />
      </View>
      <Text
        className="text-lg text-center mb-2"
        style={{ color: colors.foreground, fontFamily: "Inter_700Bold" }}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          className="text-sm text-center mb-6"
          style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular", lineHeight: 20 }}
        >
          {subtitle}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <TouchableOpacity
          onPress={onAction}
          className="px-6 py-3 rounded-full"
          style={{ backgroundColor: colors.primary }}
          activeOpacity={0.85}
        >
          <Text
            className="text-base"
            style={{ color: colors.primaryForeground, fontFamily: "Inter_600SemiBold" }}
          >
            {actionLabel}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
