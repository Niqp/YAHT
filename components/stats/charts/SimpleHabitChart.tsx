import { AppText } from "@/components/ui";
import { BorderRadius, Spacing } from "@/constants/Spacing";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/i18n";
import type { ChartDay } from "@/types/habit";
import { getCurrentDateDayjs, getDayjs } from "@/utils/date";
import { Check, Minus, X } from "lucide-react-native";
import React from "react";
import { StyleSheet, View } from "react-native";

interface SimpleHabitChartProps {
  days: ChartDay[];
}

const SimpleHabitChart: React.FC<SimpleHabitChartProps> = ({ days }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const doneColor = colors.accent;

  return (
    <View style={styles.activityMapSection}>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, { backgroundColor: doneColor, borderColor: doneColor }]}>
            <Check size={12} color={colors.textOnAccent} strokeWidth={2} />
          </View>
          <AppText variant="tiny" color={colors.textSecondary}>
            {t("common.done")}
          </AppText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, { backgroundColor: colors.dangerSoftBg, borderColor: colors.danger }]}>
            <X size={12} color={colors.danger} strokeWidth={2} />
          </View>
          <AppText variant="tiny" color={colors.textSecondary}>
            {t("stats.missed")}
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

      <View style={styles.simpleHabitChartContainer}>
        {days.map((day) => {
          const isFutureDay = getDayjs(day.date).startOf("day").isAfter(getCurrentDateDayjs());
          const isDue = day.isDue && !isFutureDay;
          const isCompleted = isDue && day.isCompleted;
          const isOffDay = !isDue;
          const iconColor = isCompleted ? colors.textOnAccent : isOffDay ? colors.textTertiary : colors.danger;

          return (
            <View key={day.date} style={styles.dayColumn}>
              <AppText variant="small" color={colors.textSecondary}>
                {day.label}
              </AppText>
              <View
                testID={`simple-habit-chart-day-${day.date}`}
                style={[
                  styles.completionIndicator,
                  {
                    backgroundColor: isCompleted ? doneColor : isOffDay ? colors.bgInset : colors.dangerSoftBg,
                    borderColor: isCompleted ? doneColor : isOffDay ? colors.inputBorder : colors.danger,
                  },
                ]}
              >
                {isCompleted ? (
                  <Check size={16} color={iconColor} strokeWidth={2} />
                ) : isOffDay ? (
                  <Minus size={16} color={iconColor} strokeWidth={2} />
                ) : (
                  <X size={16} color={iconColor} strokeWidth={2} />
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  activityMapSection: {
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
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  simpleHabitChartContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.xs,
    paddingTop: Spacing.sm,
  },
  dayColumn: {
    flex: 1,
    alignItems: "center",
    gap: Spacing.base,
  },
  completionIndicator: {
    width: Spacing.xxl,
    height: Spacing.xxl,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
});

export default SimpleHabitChart;
