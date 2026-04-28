import { AppText, Card, ProgressBar } from "@/components/ui";
import { Spacing } from "@/constants/Spacing";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/i18n";
import type { OverallStats as OverallStatsData } from "@/types/habit";
import { CalendarDays, CheckCheck, CheckSquare, X } from "lucide-react-native";
import React from "react";
import { StyleSheet, View } from "react-native";

interface OverallStatsProps {
  stats: OverallStatsData;
}

interface OverviewCardProps {
  title: string;
  accentValue: string;
  heroValue: string;
  heroLabel: string;
  progressValue: number;
  metrics: Array<{
    key: string;
    label: string;
    value: string;
    icon: React.ReactElement;
  }>;
}

const OverallStats: React.FC<OverallStatsProps> = ({ stats }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const remainingToday = Math.max(stats.dueToday - stats.completedToday, 0);
  const missedLast7Days = Math.max(stats.dueLast7Days - stats.completedLast7Days, 0);

  return (
    <View style={styles.stack}>
      <OverviewCard
        title={t("stats.today")}
        accentValue={`${stats.todayAdherence}%`}
        heroValue={stats.dueToday === 0 ? "0/0" : `${stats.completedToday}/${stats.dueToday}`}
        heroLabel={stats.dueToday === 0 ? t("stats.nothingScheduledToday") : t("common.completed")}
        progressValue={stats.todayAdherence}
        metrics={[
          {
            key: "activeHabits",
            label: t("stats.activeHabitsLabel"),
            value: stats.activeHabits.toString(),
            icon: <CheckSquare size={16} color={colors.iconPrimary} strokeWidth={2} />,
          },
          {
            key: "dueToday",
            label: t("stats.dueToday"),
            value: stats.dueToday.toString(),
            icon: <CalendarDays size={16} color={colors.iconPrimary} strokeWidth={2} />,
          },
          {
            key: "remainingToday",
            label: t("stats.remaining"),
            value: remainingToday.toString(),
            icon: <X size={16} color={colors.iconPrimary} strokeWidth={2} />,
          },
        ]}
      />

      <OverviewCard
        title={t("stats.last7Days")}
        accentValue={`${stats.last7DayAdherence}%`}
        heroValue={stats.dueLast7Days === 0 ? "0/0" : `${stats.completedLast7Days}/${stats.dueLast7Days}`}
        heroLabel={stats.dueLast7Days === 0 ? t("stats.nothingScheduledYet") : t("common.completed")}
        progressValue={stats.last7DayAdherence}
        metrics={[
          {
            key: "dueLast7Days",
            label: t("stats.habitChecks"),
            value: stats.dueLast7Days.toString(),
            icon: <CalendarDays size={16} color={colors.iconPrimary} strokeWidth={2} />,
          },
          {
            key: "completedLast7Days",
            label: t("common.completed"),
            value: stats.completedLast7Days.toString(),
            icon: <CheckCheck size={16} color={colors.iconPrimary} strokeWidth={2} />,
          },
          {
            key: "missedLast7Days",
            label: t("stats.missed"),
            value: missedLast7Days.toString(),
            icon: <X size={16} color={colors.iconPrimary} strokeWidth={2} />,
          },
        ]}
      />
    </View>
  );
};

const OverviewCard = ({ title, accentValue, heroValue, heroLabel, progressValue, metrics }: OverviewCardProps) => {
  const { colors } = useTheme();

  return (
    <Card padding="none">
      <View style={styles.section}>
        <View style={styles.headerRow}>
          <AppText variant="title">{title}</AppText>
          <AppText variant="title" color={colors.accent} tabularNums>
            {accentValue}
          </AppText>
        </View>

        <View style={styles.heroRow}>
          <AppText variant="display" tabularNums style={styles.heroValue}>
            {heroValue}
          </AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            {heroLabel}
          </AppText>
        </View>

        <ProgressBar value={progressValue} />

        <View style={styles.metricList}>
          {metrics.map((metric, index) => (
            <View key={metric.key}>
              <View style={styles.metricRow}>
                <View style={styles.metricLabel}>
                  <View style={styles.metricIcon}>{metric.icon}</View>
                  <AppText variant="body" color={colors.textSecondary} style={styles.metricLabelText}>
                    {metric.label}
                  </AppText>
                </View>
                <AppText variant="bodyMedium" tabularNums style={styles.metricValue}>
                  {metric.value}
                </AppText>
              </View>
              {index < metrics.length - 1 ? (
                <View style={[styles.metricDivider, { backgroundColor: colors.borderSubtle }]} />
              ) : null}
            </View>
          ))}
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  stack: {
    gap: Spacing.base,
  },
  section: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.lg,
    gap: Spacing.lg,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  heroRow: {
    gap: Spacing.xs,
  },
  heroValue: {
    lineHeight: 32,
  },
  metricList: {
    gap: Spacing.xs,
  },
  metricRow: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.md,
  },
  metricLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  metricIcon: {
    width: Spacing.base,
    alignItems: "center",
  },
  metricLabelText: {
    flex: 1,
  },
  metricValue: {
    minWidth: Spacing.xxl,
    textAlign: "right",
  },
  metricDivider: {
    height: 1,
    marginLeft: Spacing.base + Spacing.sm,
  },
});

export default OverallStats;
