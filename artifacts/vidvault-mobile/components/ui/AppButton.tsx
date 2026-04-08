import React, { useRef, useState } from "react";
import {
  TouchableOpacity,
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Animated,
} from "react-native";
import type { ComponentProps } from "react";
import Svg, { Defs, LinearGradient, Stop, Polygon } from "react-native-svg";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

type FeatherIconName = ComponentProps<typeof Feather>["name"];

export type AppButtonVariant = "primary" | "ghost" | "danger" | "white";
export type AppButtonSize = "lg" | "md" | "sm" | "xs";

interface AppButtonProps {
  onPress: () => void;
  label?: string;
  icon?: FeatherIconName;
  customIcon?: React.ReactNode;
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  width?: number;
}

const SIZES: Record<AppButtonSize, { h: number; cut: number; px: number; iconSize: number; fontSize: number }> = {
  lg: { h: 58, cut: 13, px: 28, iconSize: 18, fontSize: 13 },
  md: { h: 50, cut: 11, px: 24, iconSize: 16, fontSize: 12 },
  sm: { h: 40, cut: 8,  px: 16, iconSize: 14, fontSize: 11 },
  xs: { h: 38, cut: 8,  px: 0,  iconSize: 15, fontSize: 11 },
};

export function AppButton({
  onPress,
  label,
  icon,
  customIcon,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  fullWidth = false,
  width: widthProp,
}: AppButtonProps) {
  const [pressed, setPressed] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim  = useRef(new Animated.Value(0)).current;
  const colors = useColors();
  const { h, cut, px, iconSize, fontSize } = SIZES[size];
  const isXs = size === "xs" && !label;

  const screenW = Dimensions.get("window").width;

  let btnW: number;
  if (fullWidth) {
    btnW = Math.min(screenW - 48, 480);
  } else if (widthProp) {
    btnW = widthProp;
  } else if (isXs) {
    btnW = h;
  } else {
    const textLen = (label?.length ?? 0) * (fontSize * 0.62);
    const iconW = (icon || customIcon) ? iconSize + 6 : 0;
    btnW = Math.ceil(px * 2 + textLen + iconW);
  }

  const handlePressIn = () => {
    setPressed(true);
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.955,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }),
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 120,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    setPressed(false);
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 40,
        bounciness: 6,
      }),
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const isDark = colors.background === "#0a0a0f" || colors.background.startsWith("#0");

  const flatFill =
    disabled
      ? variant === "primary"
        ? colors.primary + "55"
        : "rgba(255,255,255,0.08)"
      : variant === "primary"
      ? "url(#btnGrad)"
      : variant === "white"
      ? pressed ? "#d8d8d8" : "#ffffff"
      : variant === "danger"
      ? pressed ? "#ef4444cc" : "#ef4444"
      : pressed
      ? "rgba(255,255,255,0.08)"
      : "transparent";

  const strokeColor =
    variant === "ghost"
      ? disabled
        ? isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"
        : isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.18)"
      : variant === "primary" && !disabled
      ? "rgba(139,92,246,0.4)"
      : "transparent";

  const textColor =
    variant === "white"
      ? "#08080f"
      : variant === "ghost"
      ? disabled
        ? colors.mutedForeground
        : isDark ? colors.foreground : colors.foreground
      : "#ffffff";

  const points = `${cut},0 ${btnW},0 ${btnW},${h - cut} ${btnW - cut},${h} 0,${h} 0,${cut}`;

  const gradStart = disabled ? (colors.primary + "55") : pressed ? "#7c3aed" : "#6366f1";
  const gradEnd   = disabled ? (colors.primary + "55") : pressed ? "#5b21b6" : "#8b5cf6";

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={{ width: btnW, height: h }}>
          <Svg width={btnW} height={h} style={StyleSheet.absoluteFillObject}>
            <Defs>
              <LinearGradient id="btnGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor={gradStart} />
                <Stop offset="100%" stopColor={gradEnd} />
              </LinearGradient>
            </Defs>
            <Polygon
              points={points}
              fill={flatFill}
              stroke={strokeColor}
              strokeWidth={variant === "ghost" ? 1 : variant === "primary" && !disabled ? 1 : 0}
            />
          </Svg>
          <View style={[StyleSheet.absoluteFillObject, styles.inner, { gap: (icon || customIcon) && label ? 8 : 0 }]}>
            {loading ? (
              <ActivityIndicator color={textColor} size="small" />
            ) : (
              <>
                {icon && <Feather name={icon} size={iconSize} color={textColor} />}
                {customIcon && customIcon}
                {label && (
                  <Text style={[styles.label, { color: textColor, fontSize }]} numberOfLines={1}>
                    {label}
                  </Text>
                )}
              </>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  inner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontFamily: "Eczar_600SemiBold",
    letterSpacing: 0.6,
  },
});
