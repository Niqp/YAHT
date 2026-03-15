import React, { memo, useCallback, useMemo } from "react";
import { CalendarDays, RotateCcw } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import { RepetitionType } from "@/types/habit";
import { getOrderedWeekDays } from "@/utils/date";
import { haptic } from "@/utils/haptics";
import { StyleSheet, View } from "react-native";

import { AppSegmentedControl, AppText } from "@/components/ui";
import { FormSection, PresetPills, WheelPicker } from "@/components/ui/form";
import { BorderRadius, Spacing } from "@/constants/Spacing";

interface RepetitionPatternSectionProps {
  repetitionType: RepetitionType;
  setRepetitionType: (type: RepetitionType) => void;
  selectedDays: number[];
  setSelectedDays: (days: number[]) => void;
  customDays: number;
  setCustomDays: (days: number) => void;
  weekStartDay: number;
  errorMessage?: string | null;
  presentation?: "card" | "sheet";
}

const INTERVAL_OPTIONS = Array.from({ length: 365 }, (_, index) => ({
  value: index + 1,
  label: `${index + 1} days`,
}));

const INTERVAL_PRESETS = [
  { label: "1 day", value: 1 },
  { label: "2 days", value: 2 },
  { label: "3 days", value: 3 },
  { label: "7 days", value: 7 },
] as const;

const RepetitionPatternSection: React.FC<RepetitionPatternSectionProps> = ({
  repetitionType,
  setRepetitionType,
  selectedDays,
  setSelectedDays,
  customDays,
  setCustomDays,
  weekStartDay,
  errorMessage,
  presentation = "card",
}) => {
  const { colors } = useTheme();

  const orderedWeekdays = useMemo(() => getOrderedWeekDays(weekStartDay), [weekStartDay]);
  const weekdayOptions = useMemo(
    () =>
      orderedWeekdays.map((day) => ({
        value: day.dayIndex,
        label: day.name.slice(0, 3),
      })),
    [orderedWeekdays]
  );
  const segmentedIndex = useMemo(
    () => (repetitionType === RepetitionType.DAILY ? 0 : repetitionType === RepetitionType.WEEKDAYS ? 1 : 2),
    [repetitionType]
  );

  const handleDayToggle = useCallback(
    (day: number) => {
      if (selectedDays.includes(day)) {
        setSelectedDays(selectedDays.filter((d) => d !== day));
      } else {
        setSelectedDays([...selectedDays, day]);
      }
    },
    [selectedDays, setSelectedDays]
  );

  const helperText =
    repetitionType === RepetitionType.INTERVAL
      ? `Habit becomes due ${customDays === 1 ? "every day" : `every ${customDays} days`}.`
      : repetitionType === RepetitionType.WEEKDAYS
        ? "Select the weekdays when this habit should appear."
        : "This habit appears every day.";

  const activePanel =
    repetitionType === RepetitionType.DAILY ? (
      <View style={[styles.panel, styles.centeredPanel]}>
        <View style={styles.infoBlock}>
          <View style={styles.infoRow}>
            <CalendarDays size={24} color={colors.primary} />
            <AppText variant="body" color={colors.textSecondary} style={styles.infoText}>
              This habit will repeat every single day.
            </AppText>
          </View>
        </View>
      </View>
    ) : repetitionType === RepetitionType.WEEKDAYS ? (
      <View style={styles.panel}>
        <View style={styles.scheduleControlBlock}>
          <View style={styles.completionTypeDescription}>
            <CalendarDays size={24} color={colors.primary} />
            <AppText variant="body" color={colors.textSecondary} style={styles.completionDescription}>
              Pick the days when this habit should appear each week.
            </AppText>
          </View>
          <PresetPills
            options={weekdayOptions}
            selectionMode="multiple"
            selectedValues={selectedDays}
            onToggle={handleDayToggle}
          />
        </View>
      </View>
    ) : (
      <View style={styles.panel}>
        <View style={styles.scheduleControlBlock}>
          <View style={styles.completionTypeDescription}>
            <RotateCcw size={24} color={colors.primary} />
            <AppText variant="body" color={colors.textSecondary} style={styles.completionDescription}>
              Choose how many days should pass before this habit is due again.
            </AppText>
          </View>
          <View style={[styles.pickerSurface, { backgroundColor: colors.input, borderColor: colors.inputBorder }]}>
            <WheelPicker data={INTERVAL_OPTIONS} value={customDays} onChange={setCustomDays} style={styles.picker} />
          </View>
          <PresetPills options={INTERVAL_PRESETS} selectedValue={customDays} onSelect={setCustomDays} />
        </View>
      </View>
    );

  const content = (
    <>
      <AppSegmentedControl
        values={["Daily", "Weekly", "Interval"]}
        selectedIndex={segmentedIndex}
        onChange={(index) => {
          let next = RepetitionType.DAILY;
          if (index === 1) next = RepetitionType.WEEKDAYS;
          else if (index === 2) next = RepetitionType.INTERVAL;

          if (next !== repetitionType) {
            void haptic.medium();
          }
          setRepetitionType(next);
        }}
        style={styles.segmentedControl}
      />

      <View style={[styles.optionsWrapper, { borderTopColor: colors.divider }]}>
        <View style={[styles.fixedPanelFrame, { backgroundColor: colors.input, borderColor: colors.inputBorder }]}>
          {activePanel}
        </View>

        <AppText variant="small" color={errorMessage ? colors.error : colors.textTertiary} style={styles.feedbackText}>
          {errorMessage ?? helperText}
        </AppText>
      </View>
    </>
  );

  if (presentation === "sheet") {
    return (
      <View>
        <AppText variant="title" color={colors.text} style={styles.sheetTitle}>
          Repeatability
        </AppText>
        <AppText variant="caption" color={colors.textSecondary} style={styles.sheetDescription}>
          Choose how often this habit becomes due.
        </AppText>
        {content}
      </View>
    );
  }

  return (
    <FormSection label="Schedule" description="Choose how often this habit becomes due.">
      {content}
    </FormSection>
  );
};

export default memo(RepetitionPatternSection);

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
  infoBlock: {
    paddingVertical: Spacing.xs,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 28,
  },
  infoText: {
    marginLeft: Spacing.md,
    flex: 1,
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
  scheduleControlBlock: {
    flex: 1,
    gap: Spacing.md,
  },
  picker: {
    height: 120,
    width: "100%",
  },
  pickerSurface: {
    height: 164,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    overflow: "hidden",
    justifyContent: "center",
  },
  completionTypeDescription: {
    flexDirection: "row",
    alignItems: "flex-start",
    minHeight: 44,
  },
  completionDescription: {
    marginLeft: Spacing.md,
    flex: 1,
    lineHeight: 22,
  },
  feedbackText: {
    marginTop: Spacing.sm,
  },
});
