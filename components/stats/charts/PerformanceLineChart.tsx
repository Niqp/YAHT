import { AppText } from "@/components/ui";
import { BorderRadius, Spacing } from "@/constants/Spacing";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/i18n";
import type { ChartDay, CompletionType } from "@/types/habit";
import { Check, Minus } from "lucide-react-native";
import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";

interface PerformanceLineChartProps {
  days: ChartDay[];
  completionType: CompletionType;
}

const BAR_HEIGHT = 80;

type TranslationFn = ReturnType<typeof useTranslation>["t"];

const formatCompactDuration = (valueMs: number, t: TranslationFn) => {
  const totalSeconds = Math.floor(valueMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return t("addHabit.units.hr", { count: hours });
  }

  if (minutes > 0) {
    return t("addHabit.units.min", { count: minutes });
  }

  return t("addHabit.units.sec", { count: seconds });
};

const formatValueLabel = (completionType: CompletionType, value: number, t: TranslationFn) => {
  if (completionType === "timed") {
    return formatCompactDuration(value, t);
  }

  return value.toString();
};

const PerformanceLineChart: React.FC<PerformanceLineChartProps> = ({ days, completionType }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const scaleMax = useMemo(() => {
    const values = days.filter((day) => day.isDue).flatMap((day) => [day.value, day.goal ?? 0]);
    return Math.max(1, ...values);
  }, [days]);

  return (
    <View style={styles.chartSection}>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, { backgroundColor: colors.success, borderColor: colors.success }]}>
            <Check size={12} color={colors.textOnAccent} strokeWidth={2} />
          </View>
          <AppText variant="tiny" color={colors.textSecondary}>
            {t("stats.goalMet")}
          </AppText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, { backgroundColor: colors.accent, borderColor: colors.accent }]} />
          <AppText variant="tiny" color={colors.textSecondary}>
            {t("common.completed")}
          </AppText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendGoalMarker, { backgroundColor: colors.textTertiary }]} />
          <AppText variant="tiny" color={colors.textSecondary}>
            {t("stats.goal")}
          </AppText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, { backgroundColor: colors.bgInset, borderColor: colors.inputBorder }]}>
            <Minus size={12} color={colors.textTertiary} strokeWidth={2} />
          </View>
          <AppText variant="tiny" color={colors.textSecondary}>
            {t("stats.off")}
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
                {day.isDue ? (showValue ? formatValueLabel(completionType, day.value, t) : "0") : t("stats.off")}
              </AppText>

              <View
                style={[
                  styles.barTrack,
                  {
                    backgroundColor: colors.bgInset,
                    borderColor: colors.inputBorder,
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
                          backgroundColor: day.isCompleted ? colors.success : colors.accent,
                          height: Math.max(6, barHeight),
                        },
                      ]}
                    />
                  ) : (
                    <View style={styles.skipState}>
                      <Minus size={16} color={colors.textTertiary} strokeWidth={2} />
                    </View>
                  )
                ) : (
                  <View style={styles.skipState}>
                    <Minus size={16} color={colors.textTertiary} strokeWidth={2} />
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
    gap: Spacing.lg,
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
    width: Spacing.base,
    height: Spacing.base,
    borderRadius: BorderRadius.xs,
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
    gap: Spacing.xs,
    paddingTop: Spacing.sm,
  },
  dayColumn: {
    flex: 1,
    alignItems: "center",
    gap: Spacing.base,
  },
  valueLabel: {
    minHeight: Spacing.base,
  },
  barTrack: {
    width: Spacing.xl,
    height: BAR_HEIGHT,
    borderRadius: BorderRadius.sm,
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
  },
  skipState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default PerformanceLineChart;
