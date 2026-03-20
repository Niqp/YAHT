import React, { memo, useMemo } from "react";
import { CheckSquare, Clock, RotateCcw } from "lucide-react-native";
import { StyleSheet, View } from "react-native";

import { AppSegmentedControl, AppText } from "@/components/ui";
import { DurationInput, FormSection, PresetPills, WheelPicker } from "@/components/ui/form";
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
  presentation?: "card" | "sheet";
}

const REPETITION_OPTIONS = Array.from({ length: 100 }, (_, index) => ({
  value: index + 1,
  label: `${index + 1} reps`,
}));

const REPETITION_PRESETS = [
  { label: "5", value: 5 },
  { label: "10", value: 10 },
  { label: "15", value: 15 },
  { label: "20", value: 20 },
] as const;

const formatTimedGoal = (durationMs: number) => {
  const totalMinutes = Math.max(1, Math.round(durationMs / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours} ${hours === 1 ? "hr" : "hrs"} ${minutes} min`;
  }

  if (hours > 0) {
    return `${hours} ${hours === 1 ? "hr" : "hrs"}`;
  }

  return `${minutes} min`;
};

const CompletionTypeSection: React.FC<CompletionTypeSectionProps> = ({
  completionType,
  setCompletionType,
  completionGoal,
  setCompletionGoal,
  isEditMode,
  errorMessage,
  presentation = "card",
}) => {
  const { colors } = useTheme();
  const segmentedIndex = useMemo(
    () => (completionType === CompletionType.SIMPLE ? 0 : completionType === CompletionType.REPETITIONS ? 1 : 2),
    [completionType]
  );

  const activePanel =
    completionType === CompletionType.SIMPLE ? (
      <View style={[styles.panel, styles.centeredPanel]}>
        <View style={styles.infoBlockCentered}>
          <View style={[styles.placeholderBadge, { backgroundColor: colors.primarySubtle }]}>
            <CheckSquare size={34} color={colors.primary} />
          </View>
          <AppText variant="title" color={colors.text} style={styles.placeholderTitle}>
            One tap, done
          </AppText>
          <AppText variant="caption" color={colors.textSecondary} style={styles.placeholderCaption}>
            Mark this habit complete with a single check whenever you are finished.
          </AppText>
        </View>
      </View>
    ) : completionType === CompletionType.REPETITIONS ? (
      <View style={styles.panel}>
        <View style={styles.completionTypeContainer}>
          <View style={styles.completionTypeDescription}>
            <RotateCcw size={24} color={colors.primary} />
            <AppText variant="body" color={colors.textSecondary} style={styles.completionDescription} numberOfLines={2}>
              Complete after a certain amount of repetitions.
            </AppText>
          </View>
          <View style={[styles.pickerSurface, { backgroundColor: colors.input }]}>
            <WheelPicker
              data={REPETITION_OPTIONS}
              value={completionGoal}
              onChange={setCompletionGoal}
              style={styles.picker}
              virtualized
              initialNumToRender={3}
              maxToRenderPerBatch={3}
              windowSize={5}
            />
          </View>
          <PresetPills options={REPETITION_PRESETS} selectedValue={completionGoal} onSelect={setCompletionGoal} />
        </View>
      </View>
    ) : (
      <View style={styles.panel}>
        <View style={styles.completionTypeContainer}>
          <View style={styles.completionTypeDescription}>
            <Clock size={24} color={colors.primary} />
            <AppText variant="body" color={colors.textSecondary} style={styles.completionDescription} numberOfLines={2}>
              Complete after this much time is tracked.
            </AppText>
          </View>
          <DurationInput valueMs={completionGoal} onChangeMs={setCompletionGoal} />
        </View>
      </View>
    );

  const content = (
    <>
      <AppSegmentedControl
        values={["Simple", "Repetitions", "Timed"]}
        selectedIndex={segmentedIndex}
        onChange={(index) => {
          if (index === 0) setCompletionType(CompletionType.SIMPLE);
          else if (index === 1) setCompletionType(CompletionType.REPETITIONS);
          else if (index === 2) setCompletionType(CompletionType.TIMED);
        }}
        disabled={isEditMode}
        style={styles.segmentedControl}
      />

      <View style={[styles.optionsWrapper, { borderTopColor: colors.divider }]}>
        <View style={[styles.fixedPanelFrame, { backgroundColor: colors.input, borderColor: colors.inputBorder }]}>
          {activePanel}
        </View>

        {errorMessage ? (
          <AppText variant="small" color={colors.error} style={styles.errorText}>
            {errorMessage}
          </AppText>
        ) : null}
      </View>

      {isEditMode ? (
        <View style={[styles.editNoticeContainer, { backgroundColor: colors.errorSubtle, borderColor: colors.error }]}>
          <AppText variant="label" color={colors.error} style={styles.editNotice}>
            Completion type is locked after creation.
          </AppText>
        </View>
      ) : null}
    </>
  );

  if (presentation === "sheet") {
    return (
      <View>
        <AppText variant="title" color={colors.text} style={styles.sheetTitle}>
          Habit type
        </AppText>
        <AppText variant="caption" color={colors.textSecondary} style={styles.sheetDescription}>
          Decide how this habit should be marked complete.
        </AppText>
        {content}
      </View>
    );
  }

  return (
    <FormSection label="Completion goal" description="Decide how this habit should be marked complete.">
      {content}
    </FormSection>
  );
};

export default memo(CompletionTypeSection);

const styles = StyleSheet.create({
  optionsWrapper: {
    borderTopWidth: 1,
    marginTop: Spacing.base,
    paddingTop: Spacing.base,
  },
  segmentedControl: {
    marginBottom: Spacing.base,
  },
  sheetTitle: {
    marginBottom: Spacing.xs,
  },
  sheetDescription: {
    marginBottom: Spacing.base,
  },
  fixedPanelFrame: {
    width: "100%",
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    minHeight: 288,
    height: 288,
    overflow: "hidden",
  },
  panel: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  centeredPanel: {
    justifyContent: "center",
  },
  completionTypeContainer: {
    flex: 1,
    gap: Spacing.md,
  },
  infoBlockCentered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  placeholderBadge: {
    width: 84,
    height: 84,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  placeholderTitle: {
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  placeholderCaption: {
    textAlign: "center",
    maxWidth: 220,
    lineHeight: 20,
  },
  completionTypeDescription: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 44,
  },
  completionDescription: {
    marginLeft: Spacing.md,
    flex: 1,
    lineHeight: 22,
  },
  picker: {
    height: 120,
    width: "100%",
  },
  pickerSurface: {
    height: 164,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    overflow: "hidden",
    justifyContent: "center",
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
