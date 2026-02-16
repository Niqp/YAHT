import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { Habit, HabitStats as HabitStatsData } from '../../types/habit';
import HabitTypeIndicator from './HabitTypeIndicator';
import SimpleHabitChart from './charts/SimpleHabitChart';
import PerformanceLineChart from './charts/PerformanceLineChart';
import ProgressCircle from './charts/ProgressCircle';
import HabitStats from './HabitStats';

interface HabitDetailViewProps {
  habit: Habit;
  lineChartData: {
    labels: string[];
    datasets: { data: number[] }[];
  };
  progressData: {
    labels?: string[];
    data: number[];
  };
  habitStats: HabitStatsData;
}

const HabitDetailView: React.FC<HabitDetailViewProps> = ({
  habit,
  lineChartData,
  progressData,
  habitStats
}) => {
  const { colors } = useTheme();

  if (!habit) return null;

  return (
    <View style={styles.chartContainer}>
      <View style={styles.habitHeaderContainer}>
        <Text style={[styles.habitTitle, { color: colors.text }]}>
          {habit.icon} {habit.title}
        </Text>
        <HabitTypeIndicator completionType={habit.completion.type} />
      </View>
      
      {/* Chart based on habit type */}
      {habit.completion.type === 'simple' ? (
        <SimpleHabitChart 
          labels={lineChartData.labels}
          data={lineChartData.datasets[0].data}
        />
      ) : (
        <PerformanceLineChart lineChartData={lineChartData} />
      )}
      
      {/* Progress circle for all habit types */}
      <ProgressCircle 
        progressData={progressData}
        completionType={habit.completion.type}
        stats={habitStats}
      />
      
      {/* Type-specific stats */}
      <HabitStats 
        completionType={habit.completion.type}
        habitStats={habitStats}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    marginTop: 10,
  },
  habitHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HabitDetailView;
