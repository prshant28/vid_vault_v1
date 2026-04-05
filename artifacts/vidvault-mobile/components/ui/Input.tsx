import React, { forwardRef } from "react";
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from "react-native";
import { useColors } from "@/hooks/useColors";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, containerStyle, leftIcon, rightIcon, style, ...props },
  ref
) {
  const colors = useColors();

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? (
        <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      ) : null}
      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: colors.secondary,
            borderColor: error ? colors.destructive : colors.border,
            borderRadius: colors.radius - 4,
          },
        ]}
      >
        {leftIcon ? <View style={styles.icon}>{leftIcon}</View> : null}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.mutedForeground}
          style={[
            styles.input,
            { color: colors.foreground, fontFamily: "Poppins_400Regular" },
            style,
          ]}
          {...props}
        />
        {rightIcon ? <View style={styles.icon}>{rightIcon}</View> : null}
      </View>
      {error ? (
        <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  icon: {
    marginHorizontal: 4,
  },
  input: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  error: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
  },
});
