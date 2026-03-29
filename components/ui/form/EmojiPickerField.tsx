import React from "react";
import { StyleSheet, TextInput } from "react-native";

import { BorderRadius } from "@/constants/Spacing";
import { useTheme } from "@/hooks/useTheme";

interface EmojiPickerFieldProps {
  value: string;
  onChange: (emoji: string) => void;
  placeholder?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export default function EmojiPickerField({
  value,
  onChange,
  placeholder = "✨",
  accessibilityLabel = "Habit emoji",
  accessibilityHint = "Enter a one-emoji icon for this habit",
}: EmojiPickerFieldProps) {
  const { colors } = useTheme();

  return (
    <TextInput
      style={[
        styles.input,
        {
          backgroundColor: colors.surface,
          borderColor: colors.inputBorder,
          color: colors.text,
        },
      ]}
      value={value}
      onChangeText={onChange}
      maxLength={2}
      placeholder={placeholder}
      placeholderTextColor={colors.textTertiary}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      selectionColor={colors.primary}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    paddingVertical: 0,
    fontSize: 22,
    lineHeight: 26,
    textAlign: "center",
    textAlignVertical: "center",
  },
});
