import React, { memo } from "react";
import { StyleSheet, View } from "react-native";

import { Spacing } from "@/constants/Spacing";
import { useTheme } from "@/hooks/useTheme";

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

  return (
    <FormSection label="Basic info" description="Name your habit and give it an icon.">
      <View style={styles.row}>
        <EmojiPickerField value={icon} onChange={setIcon} />

        <View style={styles.titleField}>
          <FormInput
            label="Habit title"
            hideLabel
            value={title}
            onChangeText={setTitle}
            placeholder="Habit title..."
            accessibilityLabel="Habit title"
            accessibilityHint="Enter a clear habit title"
          />
        </View>
      </View>

      {errorMessage ? (
        <AppText variant="small" color={colors.danger} style={styles.feedbackText}>
          {errorMessage}
        </AppText>
      ) : (
        <AppText variant="small" color={colors.textTertiary} style={styles.feedbackText}>
          Keep it short enough to scan at a glance.
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
