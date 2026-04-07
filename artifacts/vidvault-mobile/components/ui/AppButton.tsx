import React, { useState } from "react";
import {
  TouchableOpacity,
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from "react-native";
import type { ComponentProps } from "react";
import Svg, { Polygon } from "react-native-svg";
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

  const fillColor =
    disabled
      ? variant === "primary"
        ? colors.primary + "55"
        : "rgba(255,255,255,0.08)"
      : variant === "primary"
      ? pressed
        ? colors.primary + "dd"
        : colors.primary
      : variant === "white"
      ? pressed ? "#d8d8d8" : "#ffffff"
      : variant === "danger"
      ? pressed ? "#ef4444cc" : "#ef4444"
      : pressed
      ? "rgba(255,255,255,0.08)"
      : "transparent";

  const isDark = colors.background === "#0a0a0f" || colors.background.startsWith("#0");
  const strokeColor =
    variant === "ghost"
      ? disabled
        ? isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"
        : isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.18)"
      : "transparent";

  const textColor =
    variant === "white"
      ? "#08080f"
      : variant === "ghost"
      ? disabled
        ? colors.mutedForeground
        : isDark ? colors.foreground : colors.foreground
      : "#ffffff";

  const points = isXs
    ? `${cut},0 ${btnW},0 ${btnW},${h - cut} ${btnW - cut},${h} 0,${h} 0,${cut}`
    : `${cut},0 ${btnW},0 ${btnW},${h - cut} ${btnW - cut},${h} 0,${h} 0,${cut}`;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={1}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
    >
      <View style={{ width: btnW, height: h }}>
        <Svg width={btnW} height={h} style={StyleSheet.absoluteFillObject}>
          <Polygon
            points={points}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={variant === "ghost" ? 1 : 0}
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
  );
}

const styles = StyleSheet.create({
  inner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontFamily: "Poppins_600SemiBold",
    letterSpacing: 0.8,
  },
});
