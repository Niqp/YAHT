import { Pencil, SmilePlus } from "lucide-react-native";
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
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export default function EmojiPickerField({
  value,
  onChange,
  accessibilityLabel = translate("form.habitEmoji"),
  accessibilityHint = translate("form.emojiPickerHint"),
}: EmojiPickerFieldProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const hasValue = Boolean(value);

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
        style={styles.triggerWrapper}
      >
        <View
          style={[
            styles.trigger,
            {
              backgroundColor: colors.bgInset,
              borderColor: hasValue ? colors.inputBorder : colors.accentSoftBorder,
              borderStyle: hasValue ? "solid" : "dashed",
            },
          ]}
        >
          {hasValue ? (
            <AppText variant="title" style={styles.emojiText} color={colors.textPrimary}>
              {value}
            </AppText>
          ) : (
            <SmilePlus size={24} color={colors.accentMuted} />
          )}
        </View>

        {hasValue && (
          <View
            style={[
              styles.editBadge,
              {
                backgroundColor: colors.accent,
                borderColor: colors.bgSurface,
              },
            ]}
          >
            <Pencil size={10} color={colors.buttonPrimaryText} />
          </View>
        )}
      </View>
    </EmojiPopup>
  );
}

const styles = StyleSheet.create({
  triggerWrapper: {
    width: 52,
    height: 52,
  },
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
  editBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 18,
    height: 18,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
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
