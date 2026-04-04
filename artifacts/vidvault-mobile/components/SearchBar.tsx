import React from "react";
import { View, TextInput, TouchableOpacity } from "react-native";
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
      className="flex-row items-center px-3.5 py-2.5 border"
      style={{
        backgroundColor: colors.secondary,
        borderRadius: colors.radius,
        borderColor: colors.border,
      }}
    >
      <Feather name="search" size={18} color={colors.mutedForeground} style={{ marginRight: 10 }} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        className="flex-1 text-base p-0"
        style={{ color: colors.foreground, fontFamily: "Inter_400Regular" }}
        returnKeyType="search"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="x" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      )}
    </View>
  );
}
