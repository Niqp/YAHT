import React, { memo, useMemo } from "react";
import { CheckSquare, Clock, RotateCcw } from "lucide-react-native";
import { StyleSheet, View } from "react-native";

import { AppSegmentedControl, AppText } from "@/components/ui";
import { DurationInput, FormSection, PresetPills, WheelPicker } from "@/components/ui/form";
import { BorderRadius, Spacing } from "@/constants/Spacing";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/i18n";
import { useUnitLabelFormatter } from "@/i18n/units";
import { CompletionType } from "@/types/habit";
import { WHEEL_PICKER_CARD_HEIGHT, WHEEL_PICKER_HEIGHT } from "@/components/ui/form/WheelPicker.shared";

interface CompletionTypeSectionProps {
  completionType: CompletionType;
  setCompletionType: (type: CompletionType) => void;
  completionGoal: number;
  setCompletionGoal: (goal: number) => void;
  isEditMode: boolean;
  errorMessage?: string | null;
  presentation?: "card" | "sheet";
  showHeading?: boolean;
}

const REPETITION_PRESETS = [
  { label: "5", value: 5 },
  { label: "10", value: 10 },
  { label: "15", value: 15 },
  { label: "20", value: 20 },
] as const;

const REPETITION_VALUES = Array.from({ length: 100 }, (_, index) => index + 1);

function SimplePanel() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={[styles.panel, styles.centeredPanel]}>
      <View style={styles.infoBlockCentered}>
        <View style={[styles.placeholderBadge, { backgroundColor: colors.accentSoftBg }]}>
          <CheckSquare size={34} color={colors.accent} />
        </View>
        <AppText variant="title" color={colors.textPrimary} style={styles.placeholderTitle}>
          {t("form.oneTapDone")}
        </AppText>
        <AppText variant="caption" color={colors.textSecondary} style={styles.placeholderCaption}>
          {t("form.oneTapDoneDescription")}
        </AppText>
      </View>
    </View>
  );
}

function RepetitionsPanel({
  completionGoal,
  setCompletionGoal,
}: {
  completionGoal: number;
  setCompletionGoal: (goal: number) => void;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const formatRepetitionLabel = useUnitLabelFormatter("rep");

  return (
    <View style={styles.panel}>
      <View style={styles.completionTypeContainer}>
        <View style={styles.completionTypeDescription}>
          <RotateCcw size={24} color={colors.accent} />
          <AppText variant="body" color={colors.textSecondary} style={styles.completionDescription} numberOfLines={2}>
            {t("form.repetitionGoalDescription")}
          </AppText>
        </View>
        <View style={[styles.pickerSurface, { backgroundColor: colors.bgInset }]}>
          <WheelPicker
            values={REPETITION_VALUES}
            formatLabel={formatRepetitionLabel}
            value={completionGoal}
            onChange={setCompletionGoal}
            style={styles.picker}
          />
        </View>
        <PresetPills options={REPETITION_PRESETS} selectedValue={completionGoal} onSelect={setCompletionGoal} />
      </View>
    </View>
  );
}

function TimedPanel({
  completionGoal,
  setCompletionGoal,
}: {
  completionGoal: number;
  setCompletionGoal: (goal: number) => void;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.panel}>
      <View style={styles.completionTypeContainer}>
        <View style={styles.completionTypeDescription}>
          <Clock size={24} color={colors.accent} />
          <AppText variant="body" color={colors.textSecondary} style={styles.completionDescription} numberOfLines={2}>
            {t("form.timedGoalDescription")}
          </AppText>
        </View>
        <DurationInput valueMs={completionGoal} onChangeMs={setCompletionGoal} />
      </View>
    </View>
  );
}

const CompletionTypeSection: React.FC<CompletionTypeSectionProps> = ({
  completionType,
  setCompletionType,
  completionGoal,
  setCompletionGoal,
  isEditMode,
  errorMessage,
  presentation = "card",
  showHeading = true,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const segmentedIndex = useMemo(
    () => (completionType === CompletionType.SIMPLE ? 0 : completionType === CompletionType.REPETITIONS ? 1 : 2),
    [completionType]
  );

  const activePanel =
    completionType === CompletionType.SIMPLE ? (
      <SimplePanel />
    ) : completionType === CompletionType.REPETITIONS ? (
      <RepetitionsPanel completionGoal={completionGoal} setCompletionGoal={setCompletionGoal} />
    ) : (
      <TimedPanel completionGoal={completionGoal} setCompletionGoal={setCompletionGoal} />
    );

  const content = (
    <>
      <AppSegmentedControl
        values={[t("form.completionSimple"), t("form.completionRepetitions"), t("form.completionTimed")]}
        selectedIndex={segmentedIndex}
        onChange={(index) => {
          if (index === 0) setCompletionType(CompletionType.SIMPLE);
          else if (index === 1) setCompletionType(CompletionType.REPETITIONS);
          else if (index === 2) setCompletionType(CompletionType.TIMED);
        }}
        disabled={isEditMode}
        style={styles.segmentedControl}
      />

      <View style={[styles.optionsWrapper, { borderTopColor: colors.borderSubtle }]}>
        <View style={styles.panelFrame}>{activePanel}</View>

        {errorMessage ? (
          <AppText variant="small" color={colors.danger} style={styles.errorText}>
            {errorMessage}
          </AppText>
        ) : null}
      </View>

      {isEditMode ? (
        <View
          style={[styles.editNoticeContainer, { backgroundColor: colors.dangerSoftBg, borderColor: colors.danger }]}
        >
          <AppText variant="label" color={colors.danger} style={styles.editNotice}>
            {t("form.completionLocked")}
          </AppText>
        </View>
      ) : null}
    </>
  );

  if (presentation === "sheet") {
    return (
      <View style={styles.sheetContainer}>
        {showHeading ? (
          <>
            <AppText variant="title" color={colors.textPrimary} style={styles.sheetTitle}>
              {t("addHabit.sections.habitType")}
            </AppText>
            <AppText variant="caption" color={colors.textSecondary} style={styles.sheetDescription}>
              {t("form.completionGoalDescription")}
            </AppText>
          </>
        ) : null}
        {content}
      </View>
    );
  }

  return (
    <FormSection label={t("form.completionGoal")} description={t("form.completionGoalDescription")}>
      {content}
    </FormSection>
  );
};

export default memo(CompletionTypeSection);

const styles = StyleSheet.create({
  sheetContainer: {
    flex: 1,
  },
  optionsWrapper: {
    flex: 1,
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
  panelFrame: {
    flex: 1,
    width: "100%",
    overflow: "hidden",
  },
  panel: {
    flex: 1,
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
    height: WHEEL_PICKER_HEIGHT,
    width: "100%",
  },
  pickerSurface: {
    height: WHEEL_PICKER_CARD_HEIGHT,
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
