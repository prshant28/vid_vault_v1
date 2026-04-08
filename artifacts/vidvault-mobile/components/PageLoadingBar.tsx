import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

const PURPLE = "#6366f1";

export function PageLoadingBar({ loading }: { loading: boolean }) {
  const progress = useRef(new Animated.Value(0)).current;
  const opacity  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (loading) {
      progress.setValue(0);
      opacity.setValue(1);
      Animated.timing(progress, {
        toValue: 75,
        duration: 900,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.sequence([
        Animated.timing(progress, { toValue: 100, duration: 220, useNativeDriver: false }),
        Animated.delay(180),
        Animated.timing(opacity, { toValue: 0, duration: 280, useNativeDriver: false }),
      ]).start(() => progress.setValue(0));
    }
  }, [loading]);

  return (
    <View style={styles.track} pointerEvents="none">
      <Animated.View
        style={[
          styles.fill,
          {
            opacity,
            width: progress.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    zIndex: 999,
    overflow: "hidden",
  },
  fill: {
    height: 2,
    backgroundColor: PURPLE,
    borderRadius: 1,
    shadowColor: PURPLE,
    shadowOpacity: 0.7,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
});
