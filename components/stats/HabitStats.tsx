import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Award, CheckSquare, RotateCcw, TrendingUp, Clock } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import type { CompletionType, HabitStats as HabitStatsData } from '../../types/habit';
import { formatTime } from '../../utils/date';

interface StatItem {
  label: string;
  value: string;
  icon: JSX.Element;
}

interface HabitStatsProps {
  completionType: CompletionType;
  habitStats: HabitStatsData;
}

const HabitStats: React.FC<HabitStatsProps> = ({ completionType, habitStats }) => {
  const { colors } = useTheme();
  const screenWidth = Dimensions.get('window').width;
  
  let stats: StatItem[] = [];
  
  switch (completionType) {
    case 'simple':
      stats = [
        {
          label: 'Best Streak',
          value: habitStats.bestStreak.toString(),
          icon: <Award size={20} color={colors.primary} />,
        },
        {
          label: 'Total Completions',
          value: habitStats.totalCompletions.toString(),
          icon: <CheckSquare size={20} color={colors.primary} />,
        },
      ];
      break;
      
    case 'repetitions':
      stats = [
        {
          label: 'Average Reps',
          value: habitStats.averageRepetitions.toString(),
          icon: <RotateCcw size={20} color={colors.primary} />,
        },
        {
          label: 'Best Reps',
          value: habitStats.bestRepetitions.toString(),
          icon: <TrendingUp size={20} color={colors.primary} />,
        },
        {
          label: 'Total Reps',
          value: habitStats.totalRepetitions.toString(),
          icon: <Award size={20} color={colors.primary} />,
        },
      ];
      break;
      
    case 'timed':
      stats = [
        {
          label: 'Total Time',
          value: formatTime(habitStats.totalTimeSpent),
          icon: <Clock size={20} color={colors.primary} />,
        },
        {
          label: 'Avg Session',
          value: formatTime(habitStats.averageTimePerSession),
          icon: <RotateCcw size={20} color={colors.primary} />,
        },
        {
          label: 'Longest',
          value: formatTime(habitStats.longestSession),
          icon: <Award size={20} color={colors.primary} />,
        },
      ];
      break;
  }
  
  // Calculate the width based on the number of stats
  const statWidth = completionType === 'simple' ? '47%' : '30%';
  
  return (
    <View style={styles.typeStatsSection}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {completionType === 'simple' 
          ? 'Simple Habit Stats' 
          : completionType === 'repetitions'
            ? 'Repetition Stats'
            : 'Timed Stats'}
      </Text>
      
      <View style={styles.typeStatsGrid}>
        {stats.map((stat, index) => (
          <View 
            key={index} 
            style={[
              styles.typeStat, 
              { backgroundColor: colors.input, width: statWidth }
            ]}
          >
            <View style={styles.typeStatIconContainer}>
              {stat.icon}
            </View>
            <Text style={[styles.typeStatValue, { color: colors.text }]}>
              {stat.value}
            </Text>
            <Text style={[styles.typeStatLabel, { color: colors.textSecondary }]}>
              {stat.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  typeStatsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  typeStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  typeStat: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  typeStatIconContainer: {
    marginBottom: 8,
  },
  typeStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  typeStatLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
});

export default HabitStats;
