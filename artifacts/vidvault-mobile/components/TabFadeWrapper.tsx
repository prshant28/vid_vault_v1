import React, { useRef, useCallback } from "react";
import { Animated, StyleSheet } from "react-native";
import { useFocusEffect } from "expo-router";

export function TabFadeWrapper({ children }: { children: React.ReactNode }) {
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
    <Animated.View style={[StyleSheet.absoluteFill, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}
