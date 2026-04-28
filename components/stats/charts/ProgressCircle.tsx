import { AppText, ProgressBar } from "@/components/ui";
import { Spacing } from "@/constants/Spacing";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/i18n";
import type { HabitStats } from "@/types/habit";
import React from "react";
import { StyleSheet, View } from "react-native";

interface ProgressCircleProps {
  stats: HabitStats;
}

const ProgressCircle: React.FC<ProgressCircleProps> = ({ stats }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const progressValue = Math.max(0, Math.min(100, stats.adherenceSinceCreation));

  return (
    <View style={styles.progressSection}>
      <View style={styles.summaryCopy}>
        <AppText variant="display" tabularNums>
          {progressValue}%
        </AppText>
        {stats.dueDaysSinceCreation > 0 ? (
          <AppText variant="bodyMedium" tabularNums>
            {t("stats.scheduledDaysCount", {
              completed: stats.completedDueDays,
              total: stats.dueDaysSinceCreation,
            })}
          </AppText>
        ) : null}
      </View>

      <ProgressBar value={progressValue} />

      {stats.dueDaysSinceCreation === 0 ? (
        <AppText variant="caption" color={colors.textSecondary}>
          {t("stats.noScheduledDaysDetail")}
        </AppText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  progressSection: {
    gap: Spacing.xl,
  },
  summaryCopy: {
    gap: Spacing.xs,
  },
});

export default ProgressCircle;
