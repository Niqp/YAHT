import { ChevronDown, Pencil, SmilePlus } from "lucide-react-native";
import React, { useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import russianEmojiAnnotations from "emojibase-data/ru/compact.json";
import EmojiPicker, { emojisByCategory } from "rn-emoji-keyboard";
import type { EmojisByCategory } from "rn-emoji-keyboard";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BorderRadius } from "@/constants/Spacing";
import { useTheme } from "@/hooks/useTheme";
import { translate, useTranslation } from "@/i18n";

import AppText from "../AppText";

interface EmojiPickerFieldProps {
  value: string;
  onChange: (emoji: string) => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

let bilingualEmojisByCategory: EmojisByCategory[] | undefined;

const getBilingualEmojisByCategory = (): EmojisByCategory[] => {
  if (bilingualEmojisByCategory) {
    return bilingualEmojisByCategory;
  }

  const russianKeywordsByEmoji = new Map(
    russianEmojiAnnotations.map(({ label, tags, unicode }) => [
      unicode.replace(/\uFE0F/g, ""),
      [label, ...(tags ?? [])],
    ])
  );

  bilingualEmojisByCategory = emojisByCategory.map((category) => ({
    ...category,
    data: category.data.map((emoji) => {
      const russianKeywords = russianKeywordsByEmoji.get(emoji.emoji.replace(/\uFE0F/g, ""));

      return russianKeywords
        ? {
            ...emoji,
            keywords: [...(emoji.keywords ?? []), ...russianKeywords],
          }
        : emoji;
    }),
  }));

  return bilingualEmojisByCategory;
};

export default function EmojiPickerField({
  value,
  onChange,
  accessibilityLabel = translate("form.habitEmoji"),
  accessibilityHint = translate("form.emojiPickerHint"),
}: EmojiPickerFieldProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const hasValue = Boolean(value);

  const handleEmojiSelected = ({ emoji }: { emoji: string }) => {
    onChange(emoji);
    setIsOpen(false);
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        onPress={() => setIsOpen(true)}
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
      </Pressable>

      <EmojiPicker
        open={isOpen}
        onClose={() => setIsOpen(false)}
        onEmojiSelected={handleEmojiSelected}
        customButtons={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("form.closeEmojiPicker")}
            onPress={() => setIsOpen(false)}
            style={[
              styles.closeButton,
              {
                backgroundColor: colors.buttonSecondaryBg,
                borderColor: colors.buttonSecondaryBorder,
              },
            ]}
          >
            <ChevronDown size={22} color={colors.buttonSecondaryText} />
          </Pressable>
        }
        enableSearchBar
        emojisByCategory={i18n.resolvedLanguage?.startsWith("ru") ? getBilingualEmojisByCategory() : emojisByCategory}
        styles={{
          container: {
            paddingBottom: Platform.OS === "android" ? insets.bottom : 0,
          },
        }}
        translation={{
          recently_used: t("form.emojiCategories.recentlyUsed"),
          smileys_emotion: t("form.emojiCategories.smileysEmotion"),
          people_body: t("form.emojiCategories.peopleBody"),
          animals_nature: t("form.emojiCategories.animalsNature"),
          food_drink: t("form.emojiCategories.foodDrink"),
          travel_places: t("form.emojiCategories.travelPlaces"),
          activities: t("form.emojiCategories.activities"),
          objects: t("form.emojiCategories.objects"),
          symbols: t("form.emojiCategories.symbols"),
          flags: t("form.emojiCategories.flags"),
          search: t("form.emojiCategories.search"),
        }}
        theme={{
          backdrop: colors.overlay,
          container: colors.bgSurface,
          header: colors.textPrimary,
          knob: colors.borderStrong,
          skinTonesContainer: colors.bgInset,
          category: {
            icon: colors.textSecondary,
            iconActive: colors.accent,
            container: colors.bgInset,
            containerActive: colors.accentSoftBg,
          },
          search: {
            background: colors.bgInset,
            text: colors.textPrimary,
            placeholder: colors.textSecondary,
            icon: colors.textSecondary,
          },
          emoji: {
            selected: colors.accentSoftBg,
          },
        }}
      />
    </>
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
  closeButton: {
    width: 40,
    height: 40,
    marginTop: 16,
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
});
