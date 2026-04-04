import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";

interface AvatarProps {
  name?: string | null;
  imageUrl?: string | null;
  size?: number;
}

export function Avatar({ name, imageUrl, size = 40 }: AvatarProps) {
  const colors = useColors();
  const initials = (name ?? "?").trim().slice(0, 2).toUpperCase();
  const fontSize = size * 0.35;

  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
        resizeMode="cover"
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.primary },
      ]}
    >
      <Text style={[styles.initials, { fontSize, color: colors.primaryForeground }]}>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    overflow: "hidden",
  },
  fallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    fontFamily: "Inter_700Bold",
  },
});
