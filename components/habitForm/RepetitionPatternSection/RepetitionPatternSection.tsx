import { CalendarDays } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import { RepetitionType } from "@/types/habit";
import { getOrderedWeekDays } from "@/utils/date";
import { haptic } from "@/utils/haptics";
import type React from "react";
import { Platform, Pressable, StyleSheet, Switch, View } from "react-native";

import AppText from "@/components/ui/AppText";
import { FormSection } from "@/components/ui/form";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import WheelPicker from "@quidone/react-native-wheel-picker";
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
}

const RepetitionPatternSection: React.FC<RepetitionPatternSectionProps> = ({
  repetitionType,
  setRepetitionType,
  selectedDays,
  setSelectedDays,
  customDays,
  setCustomDays,
  weekStartDay,
  errorMessage,
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
            <View style={styles.switchesContainer}>
              {WEEKDAYS.map((day, index) => {
                const isSelected = selectedDays.includes(day.dayIndex);

                return (
                  <Pressable
                    key={day.dayIndex}
                    onPress={() => handleDayToggle(day.dayIndex)}
                    android_ripple={Platform.OS === "android" ? { color: colors.ripple } : undefined}
                    style={({ pressed }) => [
                      styles.switchRow,
                      {
                        borderBottomColor: index === WEEKDAYS.length - 1 ? "transparent" : colors.divider,
                      },
                      Platform.OS === "ios" && pressed ? styles.switchRowPressed : null,
                    ]}
                  >
                    <View style={styles.switchTextBlock}>
                      <AppText variant="body" color={colors.text}>
                        {day.name}
                      </AppText>
                      <AppText variant="caption" color={colors.textTertiary}>
                        {isSelected ? "Habit appears on this day." : "Not scheduled on this day."}
                      </AppText>
                    </View>
                    <Switch
                      value={isSelected}
                      onValueChange={() => handleDayToggle(day.dayIndex)}
                      trackColor={{ false: colors.inputBorder, true: colors.primary }}
                      thumbColor={Platform.OS === "android" ? colors.cardBackground : undefined}
                      ios_backgroundColor={colors.inputBorder}
                    />
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      case RepetitionType.INTERVAL:
        return (
          <View style={styles.intervalPickerContainer}>
            <WheelPicker
              data={Array.from({ length: 365 }, (_, i) => ({ value: i + 1, label: `${i + 1} days` }))}
              value={customDays}
              onValueChanged={({ item }: { item: { value: number; label: string } }) => setCustomDays(item.value)}
              style={{ height: 150, width: "100%" }}
              itemHeight={40}
              itemTextStyle={{ color: colors.text, fontSize: 18 }}
              overlayItemStyle={{ backgroundColor: colors.primarySubtle, borderRadius: BorderRadius.md }}
            />
          </View>
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
    <FormSection label="Schedule" description="Choose how often this habit becomes due.">
      <SegmentedControl
        values={["Daily", "Weekly", "Interval"]}
        selectedIndex={repetitionType === RepetitionType.DAILY ? 0 : repetitionType === RepetitionType.WEEKDAYS ? 1 : 2}
        onChange={(event) => {
          const index = event.nativeEvent.selectedSegmentIndex;
          let next = RepetitionType.DAILY;
          if (index === 1) next = RepetitionType.WEEKDAYS;
          else if (index === 2) next = RepetitionType.INTERVAL;

          if (next !== repetitionType) {
            void haptic.medium();
          }
          setRepetitionType(next);
        }}
        tintColor={colors.primary}
        backgroundColor={colors.cardBackground}
        style={styles.segmentedControl}
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

            {errorMessage ? (
              <AppText variant="small" color={colors.error} style={styles.sharedHelperText}>
                {errorMessage}
              </AppText>
            ) : null}
          </View>
        ) : (
          <View>
            {renderRepetitionOptions()}
            {errorMessage ? (
              <AppText variant="small" color={colors.error} style={styles.topLevelErrorText}>
                {errorMessage}
              </AppText>
            ) : null}
          </View>
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
  segmentedControl: {
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
  switchesContainer: {
    marginTop: Spacing.xs,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    borderBottomWidth: 1,
  },
  switchTextBlock: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  switchRowPressed: {
    opacity: 0.8,
  },
  intervalPickerContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    overflow: "hidden",
  },
  topLevelErrorText: {
    marginTop: Spacing.sm,
  },
});
