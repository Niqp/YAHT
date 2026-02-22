import { CheckSquare, Clock, RotateCcw } from "lucide-react-native";
import type React from "react";
import { StyleSheet, View } from "react-native";

import AppText from "@/components/ui/AppText";
import { FormSection, GoalStepperInput, SegmentedControl } from "@/components/ui/form";
import { BorderRadius, Spacing } from "@/constants/Spacing";
import { useTheme } from "@/hooks/useTheme";
import { CompletionType } from "@/types/habit";

interface CompletionTypeSectionProps {
  completionType: CompletionType;
  setCompletionType: (type: CompletionType) => void;
  completionGoal: number;
  setCompletionGoal: (goal: number) => void;
  isEditMode: boolean;
}

const CompletionTypeSection: React.FC<CompletionTypeSectionProps> = ({
  completionType,
  setCompletionType,
  completionGoal,
  setCompletionGoal,
  isEditMode,
}) => {
  const { colors } = useTheme();

  const renderCompletionOptions = () => {
    switch (completionType) {
      case "simple":
        return (
          <View style={styles.infoBlock}>
            <View style={styles.completionTypeDescription}>
              <CheckSquare size={24} color={colors.primary} />
              <AppText variant="body" color={colors.textSecondary} style={styles.completionDescription}>
                Simple completion (done or not done)
              </AppText>
            </View>
          </View>
        );
      case "repetitions":
        return (
          <View style={styles.completionTypeContainer}>
            <View style={styles.completionTypeDescription}>
              <RotateCcw size={24} color={colors.primary} />
              <AppText variant="body" color={colors.textSecondary} style={styles.completionDescription}>
                Track repetitions (e.g., number of exercises)
              </AppText>
            </View>
            <View
              style={[styles.goalControlContainer, { backgroundColor: colors.input, borderColor: colors.inputBorder }]}
            >
              <GoalStepperInput
                label="Target repetitions"
                value={completionGoal}
                onChange={setCompletionGoal}
                min={1}
                max={100}
                presets={[5, 10, 20, 50]}
              />
            </View>
          </View>
        );
      case "timed":
        return (
          <View style={styles.completionTypeContainer}>
            <View style={styles.completionTypeDescription}>
              <Clock size={24} color={colors.primary} />
              <AppText variant="body" color={colors.textSecondary} style={styles.completionDescription}>
                Track time (e.g., minutes of exercise)
              </AppText>
            </View>
            <View
              style={[styles.goalControlContainer, { backgroundColor: colors.input, borderColor: colors.inputBorder }]}
            >
              <GoalStepperInput
                label="Target duration"
                value={Math.max(1, Math.floor(completionGoal / 60000))}
                onChange={(minutes: number) => setCompletionGoal(minutes * 60000)}
                min={1}
                max={120}
                unit="m"
                presets={[5, 10, 15, 30, 60, 90]}
              />
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <FormSection label="Completion goal">
      <SegmentedControl
        options={[
          {
            label: "Simple",
            value: CompletionType.SIMPLE,
            disabled: isEditMode && completionType !== CompletionType.SIMPLE,
          },
          {
            label: "Repetitions",
            value: CompletionType.REPETITIONS,
            disabled: isEditMode && completionType !== CompletionType.REPETITIONS,
          },
          {
            label: "Timed",
            value: CompletionType.TIMED,
            disabled: isEditMode && completionType !== CompletionType.TIMED,
          },
        ]}
        value={completionType}
        onChange={(next) => setCompletionType(next as CompletionType)}
        disabled={false}
      />

      <View style={[styles.optionsWrapper, { borderTopColor: colors.divider }]}>{renderCompletionOptions()}</View>

      {isEditMode ? (
        <View style={[styles.editNoticeContainer, { backgroundColor: colors.errorSubtle, borderColor: colors.error }]}>
          <AppText variant="label" color={colors.error} style={styles.editNotice}>
            Completion type is locked after creation.
          </AppText>
        </View>
      ) : null}
    </FormSection>
  );
};

export default CompletionTypeSection;

const styles = StyleSheet.create({
  optionsWrapper: {
    borderTopWidth: 1,
    marginTop: Spacing.base,
    paddingTop: Spacing.base,
    minHeight: 80,
    justifyContent: "center",
  },
  completionTypeContainer: {
    gap: Spacing.md,
  },
  infoBlock: {
    paddingVertical: Spacing.xs,
  },
  completionTypeDescription: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 28,
  },
  completionDescription: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  goalControlContainer: {
    width: "100%",
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  editNoticeContainer: {
    marginTop: Spacing.base,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  editNotice: {
    textAlign: "center",
  },
});
