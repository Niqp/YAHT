import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { EmojiPopup } from "react-native-emoji-popup";

import { BorderRadius, Spacing } from "@/constants/Spacing";
import { useTheme } from "@/hooks/useTheme";
import { translate, useTranslation } from "@/i18n";

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
  accessibilityLabel = translate("form.habitEmoji"),
  accessibilityHint = translate("form.emojiPickerHint"),
}: EmojiPickerFieldProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const displayValue = value || placeholder;

  return (
    <EmojiPopup
      onEmojiSelected={onChange}
      contentContainerStyle={[
        styles.modalContent,
        {
          backgroundColor: colors.bgSurface,
        },
      ]}
      closeButton={({ close }) => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("form.closeEmojiPicker")}
          onPress={close}
          style={[
            styles.closeButton,
            {
              backgroundColor: colors.buttonSecondaryBg,
              borderColor: colors.buttonSecondaryBorder,
            },
          ]}
        >
          <AppText variant="label" color={colors.buttonSecondaryText}>
            {t("form.close")}
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
            backgroundColor: colors.bgInset,
            borderColor: colors.inputBorder,
          },
        ]}
      >
        <AppText variant="title" style={styles.emojiText} color={value ? colors.textPrimary : colors.textTertiary}>
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
