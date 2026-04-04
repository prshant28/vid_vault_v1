import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import { useColors } from "@/hooks/useColors";

type Variant = "primary" | "secondary" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
}: ButtonProps) {
  const colors = useColors();

  const bgColor = {
    primary: colors.primary,
    secondary: colors.secondary,
    ghost: "transparent",
    destructive: colors.destructive,
  }[variant];

  const textColor = {
    primary: colors.primaryForeground,
    secondary: colors.foreground,
    ghost: colors.foreground,
    destructive: colors.destructiveForeground,
  }[variant];

  const paddingVertical = { sm: 8, md: 12, lg: 16 }[size];
  const paddingHorizontal = { sm: 14, md: 18, lg: 24 }[size];
  const fontSize = { sm: 13, md: 15, lg: 16 }[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[
        styles.btn,
        {
          backgroundColor: disabled ? bgColor + "60" : bgColor,
          paddingVertical,
          paddingHorizontal,
          borderRadius: colors.radius,
          alignSelf: fullWidth ? "stretch" : "flex-start",
          borderWidth: variant === "ghost" ? 1 : 0,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.label, { color: textColor, fontSize }, textStyle]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  label: {
    fontFamily: "Inter_600SemiBold",
  },
});
