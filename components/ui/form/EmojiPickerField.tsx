import React from "react";
import { StyleSheet, TextInput } from "react-native";

import { BorderRadius } from "@/constants/Spacing";
import { useTheme } from "@/hooks/useTheme";
import { translate } from "@/i18n";

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
  accessibilityLabel = translate("form.habitEmoji"),
  accessibilityHint = translate("form.emojiInputHint"),
}: EmojiPickerFieldProps) {
  const { colors } = useTheme();
  const hasValue = Boolean(value);

  return (
    <TextInput
      style={[
        styles.input,
        {
          backgroundColor: colors.bgInset,
          borderColor: hasValue ? colors.inputBorder : colors.accentSoftBorder,
          borderStyle: hasValue ? "solid" : "dashed",
          color: colors.textPrimary,
        },
      ]}
      value={value}
      onChangeText={onChange}
      maxLength={2}
      placeholder={placeholder}
      placeholderTextColor={colors.inputPlaceholder}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      selectionColor={colors.inputBorderFocus}
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
