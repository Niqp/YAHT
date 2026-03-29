import { AppText } from "@/components/ui";
import { BorderRadius, Spacing } from "@/constants/Spacing";
import { useTheme } from "@/hooks/useTheme";
import type { ChartDay } from "@/types/habit";
import { Check, Minus, X } from "lucide-react-native";
import React from "react";
import { StyleSheet, View } from "react-native";

interface SimpleHabitChartProps {
  days: ChartDay[];
}

const SimpleHabitChart: React.FC<SimpleHabitChartProps> = ({ days }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.activityMapSection}>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
            <Check size={12} color={colors.buttonPrimaryText} />
          </View>
          <AppText variant="small" color={colors.textSecondary}>
            Done
          </AppText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <X size={12} color={colors.textSecondary} />
          </View>
          <AppText variant="small" color={colors.textSecondary}>
            Missed
          </AppText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, { backgroundColor: colors.input, borderColor: colors.border }]}>
            <Minus size={12} color={colors.textTertiary} />
          </View>
          <AppText variant="small" color={colors.textSecondary}>
            Off day
          </AppText>
        </View>
      </View>

      <View style={styles.simpleHabitChartContainer}>
        {days.map((day) => {
          const isCompleted = day.isDue && day.isCompleted;
          const isOffDay = !day.isDue;
          const iconColor = isCompleted
            ? colors.buttonPrimaryText
            : isOffDay
              ? colors.textTertiary
              : colors.textSecondary;

          return (
            <View key={day.date} style={styles.dayColumn}>
              <AppText variant="small" color={colors.textSecondary}>
                {day.label}
              </AppText>
              <View
                style={[
                  styles.completionIndicator,
                  {
                    backgroundColor: isCompleted ? colors.primary : isOffDay ? colors.input : colors.surface,
                    borderColor: isCompleted ? colors.primary : colors.border,
                  },
                ]}
              >
                {isCompleted ? (
                  <Check size={18} color={iconColor} />
                ) : isOffDay ? (
                  <Minus size={18} color={iconColor} />
                ) : (
                  <X size={18} color={iconColor} />
                )}
              </View>
              <AppText variant="tiny" color={colors.textSecondary}>
                {isCompleted ? "Done" : isOffDay ? "Off" : "Missed"}
              </AppText>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  activityMapSection: {
    gap: Spacing.base,
  },
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  legendSwatch: {
    width: 22,
    height: 22,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  simpleHabitChartContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  dayColumn: {
    flex: 1,
    alignItems: "center",
    gap: Spacing.sm,
  },
  completionIndicator: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
});

export default SimpleHabitChart;
