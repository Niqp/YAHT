import React, { memo, useCallback, useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { BorderRadius, Spacing } from "@/constants/Spacing";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/i18n";
import { useUnitLabelFormatter } from "@/i18n/units";

import AppText from "../AppText";
import PresetPills from "./PresetPills";
import WheelPicker from "./WheelPicker";
import { WHEEL_PICKER_CARD_HEIGHT, WHEEL_PICKER_HEIGHT } from "./WheelPicker.shared";

const MIN_DURATION_MS = 60 * 1000;

const DURATION_PRESET_VALUES = [
  { minutes: 5, value: 5 * 60 * 1000 },
  { minutes: 15, value: 15 * 60 * 1000 },
  { minutes: 30, value: 30 * 60 * 1000 },
  { hours: 1, value: 60 * 60 * 1000 },
] as const;

const HOUR_VALUES = Array.from({ length: 24 }, (_, index) => index);
const ALL_MINUTE_VALUES = Array.from({ length: 60 }, (_, index) => index);
const NONZERO_MINUTE_VALUES = ALL_MINUTE_VALUES.slice(1);

interface DurationInputProps {
  valueMs: number;
  onChangeMs: (valueMs: number) => void;
}
function DurationInput({ valueMs, onChangeMs }: DurationInputProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const formatHourLabel = useUnitLabelFormatter("hr");
  const formatMinuteLabel = useUnitLabelFormatter("min");
  const normalizedValueMs = Math.max(MIN_DURATION_MS, valueMs);
  const durationPresets = useMemo(
    () =>
      DURATION_PRESET_VALUES.map((preset) => ({
        value: preset.value,
        label: "hours" in preset ? formatHourLabel(preset.hours) : formatMinuteLabel(preset.minutes),
      })),
    [formatHourLabel, formatMinuteLabel]
  );

  const hours = Math.floor(normalizedValueMs / 3600000);
  const minutes = Math.floor((normalizedValueMs % 3600000) / 60000);
  const minuteValues = hours === 0 ? NONZERO_MINUTE_VALUES : ALL_MINUTE_VALUES;

  useEffect(() => {
    if (valueMs < MIN_DURATION_MS) {
      onChangeMs(MIN_DURATION_MS);
    }
  }, [onChangeMs, valueMs]);

  const handleHoursChange = useCallback(
    (nextHours: number) => {
      const nextMinutes = nextHours === 0 && minutes === 0 ? 1 : minutes;
      onChangeMs((nextHours * 60 + nextMinutes) * 60000);
    },
    [minutes, onChangeMs]
  );
  const handleMinutesChange = useCallback(
    (nextMinutes: number) => {
      const normalizedMinutes = hours === 0 && nextMinutes === 0 ? 1 : nextMinutes;
      onChangeMs((hours * 60 + normalizedMinutes) * 60000);
    },
    [hours, onChangeMs]
  );

  return (
    <View style={styles.container}>
      <View style={[styles.displayCard, { backgroundColor: colors.bgInset }]}>
        <View style={styles.wheelsRow}>
          <View style={styles.wheelColumn}>
            <AppText variant="small" color={colors.textSecondary} style={styles.wheelLabel}>
              {t("form.hour")}
            </AppText>
            <WheelPicker
              values={HOUR_VALUES}
              formatLabel={formatHourLabel}
              value={hours}
              onChange={handleHoursChange}
              style={styles.picker}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

          <View style={styles.wheelColumn}>
            <AppText variant="small" color={colors.textSecondary} style={styles.wheelLabel}>
              {t("form.minute")}
            </AppText>
            <WheelPicker
              values={minuteValues}
              formatLabel={formatMinuteLabel}
              value={minutes}
              onChange={handleMinutesChange}
              style={styles.picker}
            />
          </View>
        </View>
      </View>

      <PresetPills options={durationPresets} selectedValue={valueMs} onSelect={onChangeMs} />
    </View>
  );
}

export default memo(DurationInput);

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  displayCard: {
    height: WHEEL_PICKER_CARD_HEIGHT,
    width: "100%",
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    overflow: "hidden",
    marginBottom: Spacing.md,
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
  wheelLabel: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  divider: {
    width: 1,
    marginHorizontal: Spacing.sm,
    marginVertical: Spacing.sm,
  },
  picker: {
    height: WHEEL_PICKER_HEIGHT,
    width: "100%",
  },
});
