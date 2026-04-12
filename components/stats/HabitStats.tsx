import { AppText, Card, ProgressBar } from "@/components/ui";
import { Spacing } from "@/constants/Spacing";
import { useTheme } from "@/hooks/useTheme";
import type { CompletionType, HabitStats as HabitStatsData } from "@/types/habit";
import { Award, CheckSquare, Clock3, RotateCcw, Target, TrendingUp } from "lucide-react-native";
import React from "react";
import { StyleSheet, View } from "react-native";

interface StatItem {
  label: string;
  value: string;
  icon: React.ReactElement;
  valueVariant?: "body" | "bodyMedium";
}

interface HabitStatsProps {
  completionType: CompletionType;
  habitStats: HabitStatsData;
}

const HabitStats: React.FC<HabitStatsProps> = ({ completionType, habitStats }) => {
  const { colors } = useTheme();

  const consistencyStats: StatItem[] = [
    {
      label: "Current streak",
      value: habitStats.currentStreak.toString(),
      icon: <RotateCcw size={16} color={colors.iconPrimary} strokeWidth={2} />,
    },
    {
      label: "Best streak",
      value: habitStats.bestStreak.toString(),
      icon: <Award size={16} color={colors.iconPrimary} strokeWidth={2} />,
    },
    {
      label: "Total completions",
      value: habitStats.totalCompletions.toString(),
      icon: <CheckSquare size={16} color={colors.iconPrimary} strokeWidth={2} />,
    },
    completionType === "simple"
      ? {
          label: "Completed due days",
          value: `${habitStats.completedDueDays}/${habitStats.dueDaysSinceCreation}`,
          icon: <CheckSquare size={16} color={colors.iconPrimary} strokeWidth={2} />,
        }
      : {
          label: "Goal hit rate",
          value: `${habitStats.goalHitRate}%`,
          icon: <Target size={16} color={colors.iconPrimary} strokeWidth={2} />,
        },
  ];

  let outputTitle;
  let outputStats: StatItem[] = [];

  if (completionType === "repetitions") {
    outputTitle = "Output";
    outputStats = [
      {
        label: "Total reps",
        value: habitStats.totalRepetitions.toString(),
        icon: <CheckSquare size={16} color={colors.iconPrimary} strokeWidth={2} />,
      },
      {
        label: "Best day",
        value: habitStats.bestDayValue.toString(),
        icon: <TrendingUp size={16} color={colors.iconPrimary} strokeWidth={2} />,
      },
    ];
  }

  if (completionType === "timed") {
    outputTitle = "Output";
    outputStats = [
      {
        label: "Total time",
        value: formatDurationLabel(habitStats.totalTimeSpent),
        icon: <Clock3 size={16} color={colors.iconPrimary} strokeWidth={2} />,
        valueVariant: "bodyMedium",
      },
      {
        label: "Best day",
        value: formatDurationLabel(habitStats.bestDayValue),
        icon: <TrendingUp size={16} color={colors.iconPrimary} strokeWidth={2} />,
        valueVariant: "bodyMedium",
      },
    ];
  }

  return (
    <View style={styles.stack}>
      <Card padding="none">
        <View style={styles.consistencySection}>
          <View style={styles.headerRow}>
            <AppText variant="title">Consistency</AppText>
            <AppText variant="title" color={colors.accent} tabularNums>
              {habitStats.adherenceSinceCreation}%
            </AppText>
          </View>

          <View style={styles.heroRow}>
            <AppText variant="display" tabularNums style={styles.heroValue}>
              {habitStats.dueDaysSinceCreation > 0
                ? `${habitStats.completedDueDays}/${habitStats.dueDaysSinceCreation}`
                : "0/0"}
            </AppText>
            <AppText variant="bodyMedium" color={colors.textSecondary}>
              {habitStats.dueDaysSinceCreation > 0 ? "Scheduled days completed" : "No scheduled days yet"}
            </AppText>
          </View>

          <ProgressBar value={habitStats.adherenceSinceCreation} />

          <StatList stats={consistencyStats} />
        </View>
      </Card>

      {outputTitle && outputStats.length > 0 && (
        <Card title={outputTitle}>
          <View style={styles.consistencySummary}>
            <StatList stats={outputStats} />
          </View>
        </Card>
      )}
    </View>
  );
};

const StatList = ({ stats }: { stats: StatItem[] }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.list}>
      {stats.map((stat, index) => (
        <View key={stat.label}>
          <View style={styles.row}>
            <View style={styles.rowLabel}>
              <View style={styles.rowIcon}>{stat.icon}</View>
              <AppText variant="body" color={colors.textSecondary} style={styles.rowLabelText}>
                {stat.label}
              </AppText>
            </View>

            <AppText variant={stat.valueVariant ?? "bodyMedium"} tabularNums numberOfLines={1} style={styles.rowValue}>
              {stat.value}
            </AppText>
          </View>
          {index < stats.length - 1 ? (
            <View style={[styles.rowDivider, { backgroundColor: colors.borderSubtle }]} />
          ) : null}
        </View>
      ))}
    </View>
  );
};

const formatDurationLabel = (valueMs: number) => {
  if (valueMs <= 0) {
    return "0s";
  }

  const totalSeconds = Math.floor(valueMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
};

const styles = StyleSheet.create({
  stack: {
    gap: Spacing.base,
  },
  consistencySection: {
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
  consistencySummary: {
    gap: Spacing.xs,
  },
  list: {
    gap: Spacing.xs,
  },
  row: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.md,
  },
  rowLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  rowIcon: {
    width: Spacing.base,
    alignItems: "center",
  },
  rowLabelText: {
    flex: 1,
  },
  rowValue: {
    flexShrink: 1,
    textAlign: "right",
  },
  rowDivider: {
    height: 1,
    marginLeft: Spacing.base + Spacing.sm,
  },
});

export default HabitStats;
