import { AppText } from "@/components/ui";
import { BorderRadius, Spacing } from "@/constants/Spacing";
import { useTheme } from "@/hooks/useTheme";
import type { HabitStats } from "@/types/habit";
import React from "react";
import { StyleSheet, View } from "react-native";

interface ProgressCircleProps {
  stats: HabitStats;
}

const ProgressCircle: React.FC<ProgressCircleProps> = ({ stats }) => {
  const { colors } = useTheme();
  const progressValue = Math.max(0, Math.min(100, stats.adherenceSinceCreation));

  return (
    <View style={styles.progressSection}>
      <View style={styles.summaryRow}>
        <View style={styles.summaryCopy}>
          <AppText variant="display" tabularNums>
            {progressValue}%
          </AppText>
          <AppText variant="body" color={colors.textSecondary}>
            Completion rate on scheduled days.
          </AppText>
        </View>

        <View style={[styles.ratioBadge, { backgroundColor: colors.primarySubtle }]}>
          <AppText variant="small" color={colors.primary} tabularNums>
            {`${stats.completedDueDays}/${stats.dueDaysSinceCreation}`}
          </AppText>
        </View>
      </View>

      <View style={[styles.progressTrack, { backgroundColor: colors.surface }]}>
        <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${progressValue}%` }]} />
      </View>

      <AppText variant="caption" color={colors.textSecondary}>
        {stats.dueDaysSinceCreation === 0
          ? "This habit has not had any scheduled days yet."
          : `Completed ${stats.completedDueDays} of ${stats.dueDaysSinceCreation} scheduled days since creation.`}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  progressSection: {
    gap: Spacing.base,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  summaryCopy: {
    flex: 1,
    gap: Spacing.xxs,
  },
  ratioBadge: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  progressTrack: {
    height: 12,
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: BorderRadius.full,
  },
});

export default ProgressCircle;
