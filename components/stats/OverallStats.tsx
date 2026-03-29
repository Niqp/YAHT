import { AppText, Card } from "@/components/ui";
import { BorderRadius, Spacing } from "@/constants/Spacing";
import { useTheme } from "@/hooks/useTheme";
import type { OverallStats as OverallStatsData } from "@/types/habit";
import { LinearGradient } from "expo-linear-gradient";
import { CalendarDays, CheckCheck, TrendingUp } from "lucide-react-native";
import React from "react";
import { StyleSheet, View } from "react-native";

interface OverallStatsProps {
  stats: OverallStatsData;
}

const OverallStats: React.FC<OverallStatsProps> = ({ stats }) => {
  const { colors } = useTheme();
  const todayMessage =
    stats.dueToday === 0
      ? "Nothing is scheduled for today."
      : `${stats.completedToday} of ${stats.dueToday} due habits are complete.`;

  return (
    <Card padding="none">
      <LinearGradient
        colors={[colors.gradientHeaderStart, colors.gradientHeaderEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.headerRow}>
          <AppText variant="title">Today at a glance</AppText>

          <View style={[styles.badge, { backgroundColor: colors.primarySubtle }]}>
            <AppText variant="small" color={colors.primary} tabularNums>
              {stats.todayAdherence}% adherence
            </AppText>
          </View>
        </View>

        <View style={styles.heroCopy}>
          <AppText variant="display" tabularNums>
            {`${stats.completedToday}/${stats.dueToday}`}
          </AppText>
          <AppText variant="body" color={colors.textSecondary}>
            completed today
          </AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            {todayMessage}
          </AppText>
        </View>

        <View style={styles.metricsRow}>
          <View style={[styles.metricTile, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <View style={[styles.metricIcon, { backgroundColor: colors.primarySubtle }]}>
              <CheckCheck size={16} color={colors.primary} />
            </View>
            <AppText variant="title" tabularNums>
              {stats.activeHabits}
            </AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              Active habits
            </AppText>
          </View>

          <View style={[styles.metricTile, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <View style={[styles.metricIcon, { backgroundColor: colors.primarySubtle }]}>
              <CalendarDays size={16} color={colors.primary} />
            </View>
            <AppText variant="title" tabularNums>
              {stats.dueToday}
            </AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              Due today
            </AppText>
          </View>

          <View style={[styles.metricTile, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <View style={[styles.metricIcon, { backgroundColor: colors.primarySubtle }]}>
              <TrendingUp size={16} color={colors.primary} />
            </View>
            <AppText variant="title" tabularNums>
              {stats.last7DayAdherence}%
            </AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              Last 7 days
            </AppText>
          </View>
        </View>
      </LinearGradient>
    </Card>
  );
};

const styles = StyleSheet.create({
  gradient: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.lg,
    gap: Spacing.base,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.md,
  },
  badge: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  heroCopy: {
    gap: Spacing.xxs,
  },
  metricsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  metricTile: {
    flex: 1,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.base,
    gap: Spacing.xs,
  },
  metricIcon: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default OverallStats;
