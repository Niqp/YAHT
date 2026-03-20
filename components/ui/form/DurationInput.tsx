import React, { memo, useCallback, useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { BorderRadius, Spacing } from "@/constants/Spacing";
import { useTheme } from "@/hooks/useTheme";

import AppText from "../AppText";
import PresetPills from "./PresetPills";
import WheelPicker from "./WheelPicker";

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, index) => ({
  value: index,
  label: index === 1 ? "1 hr" : `${index} hrs`,
}));

const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, index) => ({
  value: index,
  label: index === 1 ? "1 min" : `${index} min`,
}));
const MIN_DURATION_MS = 60 * 1000;

const DURATION_PRESETS = [
  { label: "5m", value: 5 * 60 * 1000 },
  { label: "15m", value: 15 * 60 * 1000 },
  { label: "30m", value: 30 * 60 * 1000 },
  { label: "1h", value: 60 * 60 * 1000 },
] as const;

interface DurationInputProps {
  valueMs: number;
  onChangeMs: (valueMs: number) => void;
}
function DurationInput({ valueMs, onChangeMs }: DurationInputProps) {
  const { colors } = useTheme();
  const normalizedValueMs = Math.max(MIN_DURATION_MS, valueMs);

  const hours = Math.floor(normalizedValueMs / 3600000);
  const minutes = Math.floor((normalizedValueMs % 3600000) / 60000);
  const minuteOptions = useMemo(() => (hours === 0 ? MINUTE_OPTIONS.slice(1) : MINUTE_OPTIONS), [hours]);

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
      <View style={[styles.displayCard, { backgroundColor: colors.input }]}>
        <View style={styles.wheelsRow}>
          <View style={styles.wheelColumn}>
            <AppText variant="small" color={colors.textSecondary} style={styles.wheelLabel}>
              Hours
            </AppText>
            <WheelPicker
              data={HOUR_OPTIONS}
              value={hours}
              onChange={handleHoursChange}
              style={styles.picker}
              virtualized
              initialNumToRender={3}
              maxToRenderPerBatch={3}
              windowSize={5}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          <View style={styles.wheelColumn}>
            <AppText variant="small" color={colors.textSecondary} style={styles.wheelLabel}>
              Minutes
            </AppText>
            <WheelPicker
              data={minuteOptions}
              value={minutes}
              onChange={handleMinutesChange}
              style={styles.picker}
              virtualized
              initialNumToRender={3}
              maxToRenderPerBatch={3}
              windowSize={5}
            />
          </View>
        </View>
      </View>

      <PresetPills options={DURATION_PRESETS} selectedValue={valueMs} onSelect={onChangeMs} />
    </View>
  );
}

export default memo(DurationInput);

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  displayCard: {
    height: 164,
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
    height: 120,
    width: "100%",
  },
});
