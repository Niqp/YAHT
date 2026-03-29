import { Card } from "@/components/ui";
import { Spacing } from "@/constants/Spacing";
import type { Habit, HabitChartData, HabitStats as HabitStatsData } from "@/types/habit";
import React from "react";
import { StyleSheet, View } from "react-native";

import HabitStats from "./HabitStats";
import PerformanceLineChart from "./charts/PerformanceLineChart";
import ProgressCircle from "./charts/ProgressCircle";
import SimpleHabitChart from "./charts/SimpleHabitChart";

interface HabitDetailViewProps {
  habit: Habit;
  chartData: HabitChartData;
  habitStats: HabitStatsData;
}

const HabitDetailView: React.FC<HabitDetailViewProps> = ({ habit, chartData, habitStats }) => {
  if (!habit) return null;

  return (
    <View style={styles.stack}>
      <HabitStats completionType={habit.completion.type} habitStats={habitStats} />

      <Card
        title="Recent performance"
        subtitle="A roomier view of the last seven scheduled days."
        contentStyle={styles.performanceContent}
      >
        {habit.completion.type === "simple" ? (
          <SimpleHabitChart days={chartData.days} />
        ) : (
          <PerformanceLineChart days={chartData.days} completionType={habit.completion.type} />
        )}
      </Card>

      <Card title="Consistency" subtitle="Since creation.">
        <ProgressCircle stats={habitStats} />
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  stack: {
    gap: Spacing.base,
  },
  performanceContent: {
    paddingVertical: Spacing.xl,
  },
});

export default HabitDetailView;
