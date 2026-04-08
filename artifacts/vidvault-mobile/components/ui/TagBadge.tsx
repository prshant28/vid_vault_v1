import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useColors } from "@/hooks/useColors";

interface TagBadgeProps {
  name: string;
  color?: string | null;
  onPress?: () => void;
  selected?: boolean;
}

export function TagBadge({ name, color, onPress, selected }: TagBadgeProps) {
  const colors = useColors();
  const tint = color || colors.primary;

  const bgColor = selected ? tint : tint + "20";
  const textColor = selected ? "#fff" : tint;

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={[styles.badge, { backgroundColor: bgColor }]}
      >
        <Text style={[styles.text, { color: textColor }]}>{name}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }]}>
      <Text style={[styles.text, { color: textColor }]}>{name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  text: {
    fontSize: 12,
    fontFamily: "Eczar_500Medium",
  },
});
