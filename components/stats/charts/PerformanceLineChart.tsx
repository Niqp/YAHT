import { AppText } from "@/components/ui";
import { BorderRadius, Spacing } from "@/constants/Spacing";
import { useTheme } from "@/hooks/useTheme";
import type { ChartDay, CompletionType } from "@/types/habit";
import { Check, Minus } from "lucide-react-native";
import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";

interface PerformanceLineChartProps {
  days: ChartDay[];
  completionType: CompletionType;
}

const BAR_HEIGHT = 88;

const formatCompactDuration = (valueMs: number) => {
  const totalSeconds = Math.floor(valueMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h`;
  }

  if (minutes > 0) {
    return `${minutes}m`;
  }

  return `${seconds}s`;
};

const formatValueLabel = (completionType: CompletionType, value: number) => {
  if (completionType === "timed") {
    return formatCompactDuration(value);
  }

  return value.toString();
};

const PerformanceLineChart: React.FC<PerformanceLineChartProps> = ({ days, completionType }) => {
  const { colors } = useTheme();

  const scaleMax = useMemo(() => {
    const values = days.filter((day) => day.isDue).flatMap((day) => [day.value, day.goal ?? 0]);
    return Math.max(1, ...values);
  }, [days]);

  return (
    <View style={styles.chartSection}>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
            <Check size={12} color={colors.buttonPrimaryText} />
          </View>
          <AppText variant="small" color={colors.textSecondary}>
            Goal hit
          </AppText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, { backgroundColor: colors.accent, borderColor: colors.accent }]} />
          <AppText variant="small" color={colors.textSecondary}>
            Progress
          </AppText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendGoalMarker, { backgroundColor: colors.textTertiary }]} />
          <AppText variant="small" color={colors.textSecondary}>
            Goal
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

      <View style={styles.columnsRow}>
        {days.map((day) => {
          const barHeight = day.isDue ? Math.max(0, Math.round((day.value / scaleMax) * BAR_HEIGHT)) : 0;
          const goalBottom = day.isDue && day.goal ? Math.round((day.goal / scaleMax) * BAR_HEIGHT) : null;
          const showValue = day.isDue && day.value > 0;

          return (
            <View key={day.date} style={styles.dayColumn}>
              <AppText variant="tiny" color={colors.textSecondary} numberOfLines={1} style={styles.valueLabel}>
                {day.isDue ? (showValue ? formatValueLabel(completionType, day.value) : "0") : "Off"}
              </AppText>

              <View
                style={[
                  styles.barTrack,
                  {
                    backgroundColor: day.isDue ? colors.surface : colors.input,
                    borderColor: colors.border,
                  },
                ]}
              >
                {goalBottom !== null ? (
                  <View
                    style={[
                      styles.goalMarker,
                      {
                        backgroundColor: colors.textTertiary,
                        bottom: Math.max(2, goalBottom - 1),
                      },
                    ]}
                  />
                ) : null}

                {day.isDue ? (
                  day.value > 0 ? (
                    <View
                      style={[
                        styles.barFill,
                        {
                          backgroundColor: day.isCompleted ? colors.primary : colors.accent,
                          height: Math.max(6, barHeight),
                        },
                      ]}
                    />
                  ) : (
                    <View style={styles.skipState}>
                      <Minus size={16} color={colors.textTertiary} />
                    </View>
                  )
                ) : (
                  <View style={styles.skipState}>
                    <Minus size={16} color={colors.textTertiary} />
                  </View>
                )}
              </View>

              <AppText variant="small" color={colors.textSecondary}>
                {day.label}
              </AppText>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  chartSection: {
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
  legendGoalMarker: {
    width: 12,
    height: 2,
  },
  columnsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: Spacing.sm,
  },
  dayColumn: {
    flex: 1,
    alignItems: "center",
  },
  valueLabel: {
    marginBottom: Spacing.sm,
  },
  barTrack: {
    width: "100%",
    maxWidth: 28,
    height: BAR_HEIGHT,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    justifyContent: "flex-end",
    overflow: "hidden",
    position: "relative",
  },
  goalMarker: {
    position: "absolute",
    left: 3,
    right: 3,
    height: 2,
    borderRadius: 1,
  },
  barFill: {
    width: "100%",
    borderRadius: BorderRadius.lg,
  },
  skipState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default PerformanceLineChart;
