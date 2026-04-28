import { Card } from "@/components/ui";
import { Spacing } from "@/constants/Spacing";
import { useTranslation } from "@/i18n";
import type { Habit, HabitChartData, HabitStats as HabitStatsData } from "@/types/habit";
import React from "react";
import { StyleSheet, View } from "react-native";

import HabitStats from "./HabitStats";
import PerformanceLineChart from "./charts/PerformanceLineChart";
import SimpleHabitChart from "./charts/SimpleHabitChart";

interface HabitDetailViewProps {
  habit: Habit;
  chartData: HabitChartData;
  habitStats: HabitStatsData;
}

const HabitDetailView: React.FC<HabitDetailViewProps> = ({ habit, chartData, habitStats }) => {
  const { t } = useTranslation();

  if (!habit) return null;

  return (
    <View style={styles.stack}>
      <HabitStats completionType={habit.completion.type} habitStats={habitStats} />

      <Card title={t("stats.last7ScheduledDays")} contentStyle={styles.performanceContent}>
        {habit.completion.type === "simple" ? (
          <SimpleHabitChart days={chartData.days} />
        ) : (
          <PerformanceLineChart days={chartData.days} completionType={habit.completion.type} />
        )}
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  stack: {
    gap: Spacing.base,
  },
  performanceContent: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
});

export default HabitDetailView;
