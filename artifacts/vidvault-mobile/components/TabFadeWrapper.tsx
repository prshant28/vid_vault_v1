import React, { useRef, useCallback } from "react";
import { Animated, StyleSheet } from "react-native";
import { useFocusEffect } from "expo-router";
import { useThemeContext } from "@/contexts/ThemeContext";

export function TabFadeWrapper({ children }: { children: React.ReactNode }) {
  const { colorScheme } = useThemeContext();
  const bg = colorScheme === "dark" ? "#09090c" : "#f5f5ff";

  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useFocusEffect(
    useCallback(() => {
      opacity.setValue(0);
      translateY.setValue(8);
      Animated.parallel([
        Animated.timing(opacity,    { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, speed: 18, bounciness: 4, useNativeDriver: true }),
      ]).start();
    }, [])
  );

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: bg, opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}
