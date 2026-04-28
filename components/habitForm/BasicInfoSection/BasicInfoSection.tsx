import React, { memo } from "react";
import { StyleSheet, View } from "react-native";

import { Spacing } from "@/constants/Spacing";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/i18n";

import { AppText } from "@/components/ui";
import { EmojiPickerField, FormInput, FormSection } from "@/components/ui/form";

interface BasicInfoSectionProps {
  title: string;
  setTitle: (title: string) => void;
  icon: string;
  setIcon: (icon: string) => void;
  errorMessage?: string | null;
}

const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({ title, setTitle, icon, setIcon, errorMessage }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <FormSection label={t("form.basicInfo")} description={t("form.basicInfoDescription")}>
      <View style={styles.row}>
        <EmojiPickerField value={icon} onChange={setIcon} />

        <View style={styles.titleField}>
          <FormInput
            label={t("form.habitTitle")}
            hideLabel
            value={title}
            onChangeText={setTitle}
            placeholder={t("form.habitTitlePlaceholder")}
            accessibilityLabel={t("form.habitTitle")}
            accessibilityHint={t("form.habitTitleHint")}
          />
        </View>
      </View>

      {errorMessage ? (
        <AppText variant="small" color={colors.danger} style={styles.feedbackText}>
          {errorMessage}
        </AppText>
      ) : (
        <AppText variant="small" color={colors.textTertiary} style={styles.feedbackText}>
          {t("form.titleLengthHint")}
        </AppText>
      )}
    </FormSection>
  );
};

export default memo(BasicInfoSection);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  titleField: {
    flex: 1,
  },
  feedbackText: {
    marginTop: Spacing.sm,
  },
});
