import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { EmojiPopup } from "react-native-emoji-popup";

import { BorderRadius, Spacing } from "@/constants/Spacing";
import { useTheme } from "@/hooks/useTheme";

import AppText from "../AppText";

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
  accessibilityHint = "Open the emoji picker to choose an icon for this habit",
}: EmojiPickerFieldProps) {
  const { colors } = useTheme();
  const displayValue = value || placeholder;

  return (
    <EmojiPopup
      onEmojiSelected={onChange}
      contentContainerStyle={[
        styles.modalContent,
        {
          backgroundColor: colors.cardBackground,
        },
      ]}
      closeButton={({ close }) => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close emoji picker"
          onPress={close}
          style={[
            styles.closeButton,
            {
              backgroundColor: colors.buttonSecondary,
              borderColor: colors.inputBorder,
            },
          ]}
        >
          <AppText variant="label" color={colors.buttonSecondaryText}>
            Close
          </AppText>
        </Pressable>
      )}
    >
      <View
        accessible
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        style={[
          styles.trigger,
          {
            backgroundColor: colors.cardBackground,
            borderColor: colors.inputBorder,
          },
        ]}
      >
        <AppText variant="title" style={styles.emojiText} color={value ? colors.text : colors.textTertiary}>
          {displayValue}
        </AppText>
      </View>
    </EmojiPopup>
  );
}

const styles = StyleSheet.create({
  trigger: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiText: {
    fontSize: 24,
    lineHeight: 28,
    textAlign: "center",
  },
  modalContent: {
    paddingBottom: Spacing.base,
  },
  closeButton: {
    alignSelf: "flex-end",
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
});
