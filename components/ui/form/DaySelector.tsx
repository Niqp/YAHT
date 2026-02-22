import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { BorderRadius, Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { useTheme } from "@/hooks/useTheme";

import AppText from "../AppText";

interface DaySelectorProps {
  days: { dayIndex: number; name: string }[];
  selectedDays: number[];
  onToggleDay: (dayIndex: number) => void;
}

const DAY_SHORT_LABELS: Record<number, string> = {
  0: "Su",
  1: "Mo",
  2: "Tu",
  3: "We",
  4: "Th",
  5: "Fr",
  6: "Sa",
};

export default function DaySelector({ days, selectedDays, onToggleDay }: DaySelectorProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.daysContainer, { borderColor: colors.inputBorder, backgroundColor: colors.input }]}>
      {days.map((day, index) => {
        const selected = selectedDays.includes(day.dayIndex);
        const interactionHint = selected ? "selected" : "not selected";
        const shortLabel = DAY_SHORT_LABELS[day.dayIndex] ?? day.name.slice(0, 2);

        return (
          <Pressable
            key={day.dayIndex}
            onPress={() => onToggleDay(day.dayIndex)}
            hitSlop={{ top: Spacing.xs, bottom: Spacing.xs, left: Spacing.xs, right: Spacing.xs }}
            accessibilityRole="checkbox"
            accessibilityLabel={`${day.name}, ${interactionHint}`}
            accessibilityState={{ checked: selected }}
            accessibilityHint="Double tap to toggle this weekday"
            android_ripple={{ color: colors.ripple, borderless: false }}
            style={({ pressed }) => [
              styles.dayChip,
              index > 0 && [styles.dayChipDivider, { borderLeftColor: colors.divider }],
              selected && { backgroundColor: colors.primary, borderLeftColor: colors.primary },
              pressed && !selected ? { backgroundColor: colors.surface } : null,
            ]}
          >
            <AppText
              variant="small"
              color={selected ? colors.textInverse : colors.textSecondary}
              style={styles.dayLabel}
            >
              {shortLabel}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  daysContainer: {
    width: "100%",
    flexDirection: "row",
    minHeight: 48,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  dayChip: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xs,
    justifyContent: "center",
    alignItems: "center",
  },
  dayChipDivider: {
    borderLeftWidth: 1,
  },
  dayLabel: {
    ...Typography.small,
    letterSpacing: 0,
    textAlign: "center",
  },
});
