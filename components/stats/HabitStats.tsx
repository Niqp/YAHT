import { AppText, Card } from "@/components/ui";
import { BorderRadius, Spacing } from "@/constants/Spacing";
import { useTheme } from "@/hooks/useTheme";
import type { CompletionType, HabitStats as HabitStatsData } from "@/types/habit";
import { getDayjs } from "@/utils/date";
import { Award, CalendarDays, CheckSquare, Clock3, RotateCcw, Target, TrendingUp } from "lucide-react-native";
import React from "react";
import { StyleSheet, View } from "react-native";

interface StatItem {
  label: string;
  value: string;
  icon: React.ReactElement;
  valueVariant?: "title" | "body";
}

interface HabitStatsProps {
  completionType: CompletionType;
  habitStats: HabitStatsData;
}

const HabitStats: React.FC<HabitStatsProps> = ({ completionType, habitStats }) => {
  const { colors } = useTheme();

  let stats: StatItem[] = [];
  let title = "";
  let subtitle = "";
  const lastCompletedLabel = habitStats.lastCompletedDate
    ? getDayjs(habitStats.lastCompletedDate).format("MMM D, YYYY")
    : "Never";

  switch (completionType) {
    case "simple":
      title = "Simple habit stats";
      subtitle = "Streaks and completion history.";
      stats = [
        {
          label: "Current streak",
          value: habitStats.currentStreak.toString(),
          icon: <RotateCcw size={18} color={colors.primary} />,
        },
        {
          label: "Best streak",
          value: habitStats.bestStreak.toString(),
          icon: <Award size={18} color={colors.primary} />,
        },
        {
          label: "Total completions",
          value: habitStats.totalCompletions.toString(),
          icon: <CheckSquare size={18} color={colors.primary} />,
        },
        {
          label: "Last completed",
          value: lastCompletedLabel,
          icon: <CalendarDays size={18} color={colors.primary} />,
          valueVariant: "body",
        },
      ];
      break;

    case "repetitions":
      title = "Repetition stats";
      subtitle = "Volume, streaks and goal hit rate.";
      stats = [
        {
          label: "Current streak",
          value: habitStats.currentStreak.toString(),
          icon: <RotateCcw size={18} color={colors.primary} />,
        },
        {
          label: "Goal hit rate",
          value: `${habitStats.goalHitRate}%`,
          icon: <Target size={18} color={colors.primary} />,
        },
        {
          label: "Total reps",
          value: habitStats.totalRepetitions.toString(),
          icon: <Award size={18} color={colors.primary} />,
        },
        {
          label: "Best day",
          value: habitStats.bestDayValue.toString(),
          icon: <TrendingUp size={18} color={colors.primary} />,
        },
      ];
      break;

    case "timed":
      title = "Timed habit stats";
      subtitle = "Time volume, streaks and strongest sessions.";
      stats = [
        {
          label: "Current streak",
          value: habitStats.currentStreak.toString(),
          icon: <RotateCcw size={18} color={colors.primary} />,
        },
        {
          label: "Goal hit rate",
          value: `${habitStats.goalHitRate}%`,
          icon: <Target size={18} color={colors.primary} />,
        },
        {
          label: "Total time",
          value: formatDurationLabel(habitStats.totalTimeSpent),
          icon: <Clock3 size={18} color={colors.primary} />,
          valueVariant: "body",
        },
        {
          label: "Best day",
          value: formatDurationLabel(habitStats.bestDayValue),
          icon: <Award size={18} color={colors.primary} />,
          valueVariant: "body",
        },
      ];
      break;
  }

  return (
    <Card title={title} subtitle={subtitle}>
      <View style={styles.typeStatsGrid}>
        {stats.map((stat) => (
          <View
            key={stat.label}
            style={[styles.typeStat, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={styles.typeStatTopRow}>
              <View style={[styles.typeStatIconContainer, { backgroundColor: colors.primarySubtle }]}>{stat.icon}</View>
              <AppText variant="small" color={colors.textSecondary} style={styles.typeStatLabel}>
                {stat.label}
              </AppText>
            </View>

            <AppText variant={stat.valueVariant ?? "title"} tabularNums style={styles.typeStatValue}>
              {stat.value}
            </AppText>
          </View>
        ))}
      </View>
    </Card>
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
  typeStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  typeStat: {
    flexBasis: "47%",
    flexGrow: 1,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    minHeight: 112,
    justifyContent: "space-between",
  },
  typeStatTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  typeStatIconContainer: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  typeStatLabel: {
    flex: 1,
  },
  typeStatValue: {
    paddingLeft: Spacing.xs,
  },
});

export default HabitStats;
