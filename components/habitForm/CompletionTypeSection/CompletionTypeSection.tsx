import { CheckSquare, Clock, RotateCcw } from "lucide-react-native";
import type React from "react";
import { StyleSheet, View } from "react-native";

import AppText from "@/components/ui/AppText";
import { DurationInput, FormSection } from "@/components/ui/form";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import WheelPicker from "@quidone/react-native-wheel-picker";
import { BorderRadius, Spacing } from "@/constants/Spacing";
import { useTheme } from "@/hooks/useTheme";
import { CompletionType } from "@/types/habit";

interface CompletionTypeSectionProps {
  completionType: CompletionType;
  setCompletionType: (type: CompletionType) => void;
  completionGoal: number;
  setCompletionGoal: (goal: number) => void;
  isEditMode: boolean;
  errorMessage?: string | null;
}

const CompletionTypeSection: React.FC<CompletionTypeSectionProps> = ({
  completionType,
  setCompletionType,
  completionGoal,
  setCompletionGoal,
  isEditMode,
  errorMessage,
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
              <WheelPicker
                data={Array.from({ length: 100 }, (_, i) => ({ value: i + 1, label: `${i + 1} reps` }))}
                value={completionGoal}
                onValueChanged={({ item }: { item: { value: number; label: string } }) => setCompletionGoal(item.value)}
                style={{ height: 150, width: "100%" }}
                itemHeight={40}
                itemTextStyle={{ color: colors.text, fontSize: 18 }}
                overlayItemStyle={{ backgroundColor: colors.primarySubtle, borderRadius: BorderRadius.md }}
              />
            </View>
          </View>
        );
      case CompletionType.TIMED:
        return (
          <View style={styles.completionTypeContainer}>
            <View style={styles.completionTypeDescription}>
              <Clock size={24} color={colors.primary} />
              <AppText variant="body" color={colors.textSecondary} style={styles.completionDescription}>
                Track time (e.g., minutes of exercise)
              </AppText>
            </View>
            <DurationInput label="Duration goal" valueMs={completionGoal} onChangeMs={setCompletionGoal} />
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <FormSection label="Completion goal" description="Decide how this habit should be marked complete.">
      <SegmentedControl
        values={["Simple", "Repetitions", "Timed"]}
        selectedIndex={
          completionType === CompletionType.SIMPLE ? 0 : completionType === CompletionType.REPETITIONS ? 1 : 2
        }
        onChange={(event) => {
          const index = event.nativeEvent.selectedSegmentIndex;
          if (index === 0) setCompletionType(CompletionType.SIMPLE);
          else if (index === 1) setCompletionType(CompletionType.REPETITIONS);
          else if (index === 2) setCompletionType(CompletionType.TIMED);
        }}
        enabled={!isEditMode}
        tintColor={colors.primary}
        backgroundColor={colors.cardBackground}
        style={styles.segmentedControl}
      />

      <View style={[styles.optionsWrapper, { borderTopColor: colors.divider }]}>{renderCompletionOptions()}</View>

      {errorMessage ? (
        <AppText variant="small" color={colors.error} style={styles.errorText}>
          {errorMessage}
        </AppText>
      ) : null}

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
  segmentedControl: {
    marginBottom: Spacing.base,
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
  errorText: {
    marginTop: Spacing.sm,
  },
});
