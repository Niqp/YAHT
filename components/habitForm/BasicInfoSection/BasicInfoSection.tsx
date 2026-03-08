import React from "react";
import { StyleSheet, TextInput, View } from "react-native";

import { BorderRadius, Spacing } from "@/constants/Spacing";
import { useTheme } from "@/hooks/useTheme";

import { AppText } from "@/components/ui";
import { FormInput, FormSection } from "@/components/ui/form";

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
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: colors.primarySubtle,
            },
          ]}
        >
          <TextInput
            style={[styles.emojiInput, { color: colors.text }]}
            value={icon}
            onChangeText={setIcon}
            maxLength={2}
            placeholder="✨"
            placeholderTextColor={colors.textTertiary}
            accessibilityLabel="Habit emoji"
            accessibilityHint="Enter a one-emoji icon for this habit"
            selectionColor={colors.primary}
          />
        </View>

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
        <AppText variant="small" color={colors.error} style={styles.feedbackText}>
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

export default BasicInfoSection;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiInput: {
    width: "100%",
    height: "100%",
    textAlign: "center",
    fontSize: 22,
    lineHeight: 26,
  },
  titleField: {
    flex: 1,
  },
  feedbackText: {
    marginTop: Spacing.sm,
  },
});
