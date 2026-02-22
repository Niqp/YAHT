import { CalendarDays } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import { RepetitionType } from "@/types/habit";
import { getOrderedWeekDays } from "@/utils/date";
import { haptic } from "@/utils/haptics";
import type React from "react";
import { StyleSheet, View } from "react-native";

import AppText from "@/components/ui/AppText";
import { DaySelector, FormSection, NumberStepperInput, SegmentedControl } from "@/components/ui/form";
import { BorderRadius, Spacing } from "@/constants/Spacing";

interface RepetitionPatternSectionProps {
  repetitionType: RepetitionType;
  setRepetitionType: (type: RepetitionType) => void;
  selectedDays: number[];
  setSelectedDays: (days: number[]) => void;
  customDays: number;
  setCustomDays: (days: number) => void;
  weekStartDay: number;
}

const RepetitionPatternSection: React.FC<RepetitionPatternSectionProps> = ({
  repetitionType,
  setRepetitionType,
  selectedDays,
  setSelectedDays,
  customDays,
  setCustomDays,
  weekStartDay,
}) => {
  const { colors } = useTheme();

  const WEEKDAYS = getOrderedWeekDays(weekStartDay);

  const handleDayToggle = (day: number) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const renderRepetitionOptions = () => {
    switch (repetitionType) {
      case RepetitionType.DAILY:
        return (
          <View style={styles.infoBlock}>
            <View style={styles.infoRow}>
              <CalendarDays size={24} color={colors.primary} />
              <AppText variant="body" color={colors.textSecondary} style={styles.infoText}>
                This habit will repeat every single day.
              </AppText>
            </View>
          </View>
        );
      case RepetitionType.WEEKDAYS:
        return (
          <View style={styles.scheduleControlBlock}>
            <AppText variant="label" color={colors.textSecondary}>
              Weekdays
            </AppText>
            <DaySelector days={WEEKDAYS} selectedDays={selectedDays} onToggleDay={handleDayToggle} />
          </View>
        );
      case RepetitionType.INTERVAL:
        return (
          <NumberStepperInput
            label="Interval"
            value={customDays}
            onChange={setCustomDays}
            min={1}
            max={365}
            unit="d"
            presets={[2, 3, 7, 14, 30]}
          />
        );
      default:
        return null;
    }
  };

  const helperText =
    repetitionType === RepetitionType.INTERVAL
      ? `Habit becomes due ${customDays === 1 ? "every day" : `every ${customDays} days`}.`
      : repetitionType === RepetitionType.WEEKDAYS
        ? "Select the weekdays when this habit should appear."
        : null;

  return (
    <FormSection label="Schedule">
      <SegmentedControl
        options={[
          { label: "Daily", value: RepetitionType.DAILY },
          { label: "Weekly", value: RepetitionType.WEEKDAYS },
          { label: "Interval", value: RepetitionType.INTERVAL },
        ]}
        value={repetitionType}
        accessibilityLabel="Schedule type"
        onChange={(next) => {
          if (next !== repetitionType) {
            void haptic.medium();
          }
          setRepetitionType(next as RepetitionType);
        }}
      />

      <View style={[styles.optionsWrapper, { borderTopColor: colors.divider }]}>
        {repetitionType === RepetitionType.WEEKDAYS || repetitionType === RepetitionType.INTERVAL ? (
          <View
            style={[styles.scheduleInputContainer, { backgroundColor: colors.input, borderColor: colors.inputBorder }]}
          >
            {renderRepetitionOptions()}
            {helperText ? (
              <AppText variant="small" color={colors.textTertiary} style={styles.sharedHelperText}>
                {helperText}
              </AppText>
            ) : null}
          </View>
        ) : (
          renderRepetitionOptions()
        )}
      </View>
    </FormSection>
  );
};

export default RepetitionPatternSection;

const styles = StyleSheet.create({
  optionsWrapper: {
    borderTopWidth: 1,
    marginTop: Spacing.base,
    paddingTop: Spacing.base,
    minHeight: 80,
    justifyContent: "center",
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
  scheduleInputContainer: {
    width: "100%",
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  sharedHelperText: {
    minHeight: 18,
  },
  scheduleControlBlock: {
    gap: Spacing.sm,
  },
});
