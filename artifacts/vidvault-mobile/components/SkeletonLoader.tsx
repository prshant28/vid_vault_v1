import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { MotiView } from "moti";
import { Skeleton as MotiSkeleton } from "moti/skeleton";
import { useColorScheme } from "react-native";

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = "100%", height = 16, borderRadius = 8, style }: SkeletonProps) {
  const colorScheme = useColorScheme();
  const colorMode = colorScheme === "dark" ? "dark" : "light";
  return (
    <MotiSkeleton
      colorMode={colorMode}
      width={width as number}
      height={height}
      radius={borderRadius}
    >
      <View style={[{ width: width as number, height, borderRadius }, style]} />
    </MotiSkeleton>
  );
}

export function VideoCardSkeleton() {
  const colorScheme = useColorScheme();
  const colorMode = colorScheme === "dark" ? "dark" : "light";
  return (
    <View style={{ marginBottom: 16 }}>
      <MotiSkeleton colorMode={colorMode} height={180} radius={12}>
        <View style={{ height: 180, borderRadius: 12 }} />
      </MotiSkeleton>
      <View style={{ marginTop: 10 }}>
        <MotiSkeleton colorMode={colorMode} width="80%" height={14} radius={6}>
          <View style={{ height: 14, borderRadius: 6 }} />
        </MotiSkeleton>
      </View>
      <View style={{ marginTop: 6 }}>
        <MotiSkeleton colorMode={colorMode} width="50%" height={12} radius={6}>
          <View style={{ height: 12, borderRadius: 6 }} />
        </MotiSkeleton>
      </View>
    </View>
  );
}

export function StatCardSkeleton() {
  const colorScheme = useColorScheme();
  const colorMode = colorScheme === "dark" ? "dark" : "light";
  return (
    <View style={{ flex: 1, marginRight: 12 }}>
      <MotiSkeleton colorMode={colorMode} height={60} radius={12}>
        <View style={{ height: 60, borderRadius: 12 }} />
      </MotiSkeleton>
      <View style={{ marginTop: 8 }}>
        <MotiSkeleton colorMode={colorMode} width="70%" height={12} radius={6}>
          <View style={{ height: 12, borderRadius: 6 }} />
        </MotiSkeleton>
      </View>
    </View>
  );
}

export function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 300, delay }}
    >
      {children}
    </MotiView>
  );
}
