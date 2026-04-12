import React, { memo } from "react";
import { StyleSheet, Switch, View } from "react-native";
import { AppText } from "@/components/ui";
import { FormSection, PresetPills, WheelPicker } from "@/components/ui/form";
import { BorderRadius, Spacing } from "@/constants/Spacing";
import { useTheme } from "@/hooks/useTheme";
import { WHEEL_PICKER_CARD_HEIGHT, WHEEL_PICKER_HEIGHT } from "@/components/ui/form/WheelPicker.shared";

interface ReminderSectionProps {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  hour: number;
  setHour: (hour: number) => void;
  minute: number;
  setMinute: (minute: number) => void;
  repeatIfNotCompleted: boolean;
  setRepeatIfNotCompleted: (repeat: boolean) => void;
  repeatIntervalMs: number;
  setRepeatIntervalMs: (intervalMs: number) => void;
  presentation?: "card" | "sheet";
}

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: i.toString().padStart(2, "0"),
}));

const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => ({
  value: i,
  label: i.toString().padStart(2, "0"),
}));

const INTERVAL_PRESETS = [
  { label: "5m", value: 5 * 60000 },
  { label: "15m", value: 15 * 60000 },
  { label: "30m", value: 30 * 60000 },
  { label: "1h", value: 60 * 60000 },
] as const;

const ReminderSection: React.FC<ReminderSectionProps> = ({
  enabled,
  setEnabled,
  hour,
  setHour,
  minute,
  setMinute,
  repeatIfNotCompleted,
  setRepeatIfNotCompleted,
  repeatIntervalMs,
  setRepeatIntervalMs,
  presentation = "card",
}) => {
  const { colors } = useTheme();

  const content = (
    <View style={styles.container}>
      <View style={[styles.toggleRow, { borderBottomColor: colors.borderSubtle }]}>
        <View style={styles.toggleText}>
          <AppText variant="bodyMedium" color={colors.textPrimary}>
            Daily Reminder
          </AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            Get a notification when you need to complete this habit.
          </AppText>
        </View>
        <Switch
          value={enabled}
          onValueChange={setEnabled}
          trackColor={{ false: colors.toggleOffTrack, true: colors.toggleOnTrack }}
          thumbColor={enabled ? colors.toggleOnThumb : colors.toggleOffThumb}
        />
      </View>

      <View
        style={[styles.settingsContainer, !enabled && styles.disabledSection]}
        pointerEvents={enabled ? "auto" : "none"}
      >
        <AppText variant="small" color={colors.textSecondary} style={styles.sectionLabel}>
          Time of day
        </AppText>
        <View style={[styles.timeDisplayCard, { backgroundColor: colors.bgInset }]}>
          <View style={styles.wheelsRow}>
            <View style={styles.wheelColumn}>
              <AppText variant="small" color={colors.textSecondary} style={styles.wheelLabel}>
                Hour
              </AppText>
              <WheelPicker
                data={HOUR_OPTIONS}
                value={hour}
                onChange={setHour}
                style={styles.picker}
                virtualized
                initialNumToRender={3}
                maxToRenderPerBatch={3}
                windowSize={5}
                animateMount={presentation === "sheet"}
              />
            </View>

            <View style={styles.timeSeparator}>
              <AppText variant="title" color={colors.textTertiary}>
                :
              </AppText>
            </View>

            <View style={styles.wheelColumn}>
              <AppText variant="small" color={colors.textSecondary} style={styles.wheelLabel}>
                Minute
              </AppText>
              <WheelPicker
                data={MINUTE_OPTIONS}
                value={minute}
                onChange={setMinute}
                style={styles.picker}
                virtualized
                initialNumToRender={3}
                maxToRenderPerBatch={3}
                windowSize={5}
                animateMount={presentation === "sheet"}
              />
            </View>
          </View>
        </View>

        <View style={[styles.toggleRow, styles.repeatToggleRow, { borderTopColor: colors.borderSubtle }]}>
          <View style={styles.toggleText}>
            <AppText variant="bodyMedium" color={colors.textPrimary}>
              Repeat if ignored
            </AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              Sends follow-up notifications until you complete the habit or the day ends.
            </AppText>
          </View>
          <Switch
            value={repeatIfNotCompleted}
            onValueChange={setRepeatIfNotCompleted}
            trackColor={{ false: colors.toggleOffTrack, true: colors.toggleOnTrack }}
            thumbColor={repeatIfNotCompleted ? colors.toggleOnThumb : colors.toggleOffThumb}
          />
        </View>

        <View
          style={[styles.intervalSection, !repeatIfNotCompleted && styles.disabledSection]}
          pointerEvents={repeatIfNotCompleted ? "auto" : "none"}
        >
          <AppText variant="small" color={colors.textSecondary} style={styles.sectionLabel}>
            Nagging interval
          </AppText>
          <PresetPills options={INTERVAL_PRESETS} selectedValue={repeatIntervalMs} onSelect={setRepeatIntervalMs} />
        </View>
      </View>
    </View>
  );

  if (presentation === "sheet") {
    return (
      <View>
        <AppText variant="title" color={colors.textPrimary} style={styles.sheetTitle}>
          Reminders
        </AppText>
        <AppText variant="caption" color={colors.textSecondary} style={styles.sheetDescription}>
          Configure notifications to keep you on track.
        </AppText>
        {content}
      </View>
    );
  }

  return (
    <FormSection label="Reminders" description="Configure notifications to keep you on track.">
      {content}
    </FormSection>
  );
};

export default memo(ReminderSection);

const styles = StyleSheet.create({
  container: {
    paddingBottom: Spacing.sm,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  repeatToggleRow: {
    borderBottomWidth: 0,
    borderTopWidth: 1,
    marginTop: Spacing.md,
  },
  toggleText: {
    flex: 1,
    paddingRight: Spacing.md,
    gap: 4,
  },
  settingsContainer: {
    marginTop: Spacing.md,
  },
  sectionLabel: {
    marginBottom: Spacing.sm,
  },
  timeDisplayCard: {
    height: WHEEL_PICKER_CARD_HEIGHT,
    width: "100%",
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    overflow: "hidden",
  },
  wheelsRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  wheelColumn: {
    flex: 1,
    alignItems: "stretch",
  },
  timeSeparator: {
    justifyContent: "center",
    alignItems: "center",
    paddingTop: WHEEL_PICKER_HEIGHT / 2 + 6,
    paddingHorizontal: Spacing.xs,
  },
  wheelLabel: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  picker: {
    height: WHEEL_PICKER_HEIGHT,
    width: "100%",
  },
  intervalSection: {
    marginTop: Spacing.sm,
  },
  sheetTitle: {
    marginBottom: Spacing.xs,
  },
  sheetDescription: {
    marginBottom: Spacing.base,
  },
  disabledSection: {
    opacity: 0.4,
  },
});
