import React from "react";
import { View, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChangeText, placeholder = "Search..." }: SearchBarProps) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.secondary,
          borderColor: value ? colors.primary + "55" : colors.border,
        },
      ]}
    >
      <Feather name="search" size={16} color={colors.mutedForeground} style={styles.icon} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        style={[styles.input, { color: colors.foreground }]}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="x" size={15} color={colors.mutedForeground} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    borderRadius: 8,
    height: 46,
  },
  icon: {
    marginRight: 10,
    alignSelf: "center",
    lineHeight: 16,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Eczar_400Regular",
    padding: 0,
    margin: 0,
    includeFontPadding: false,
  },
});
