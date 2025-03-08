import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { useHabitStore } from '../../store/habitStore';
import { useTheme } from '../../hooks/useTheme';
import { Habit } from '../../types/habit';
import OverallStats from '../../components/stats/OverallStats';
import HabitSelector from '../../components/stats/HabitSelector';
import HabitDetailView from '../../components/stats/HabitDetailView';
import { 
  calculateOverallStats, 
  calculateHabitStats, 
  generateChartData 
} from '../../utils/statsUtils';

export default function StatsScreen() {
  const { colors } = useTheme();
  const { habits, isLoading } = useHabitStore();
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [overallStats, setOverallStats] = useState({
    totalHabits: 0,
    completedToday: 0,
    completionRate: 0,
    currentStreak: 0,
    bestStreak: 0,
  });
  
  // Chart data state
  const [lineChartData, setLineChartData] = useState({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }],
  });
  
  const [progressData, setProgressData] = useState({
    data: [0],
  });
  
  // Habit-specific stats state
  const [habitStats, setHabitStats] = useState<any>({
    completionRate: 0,
    currentStreak: 0,
    bestStreak: 0,
    totalCompletions: 0,
    lastCompletionDate: '',
    averageRepetitions: 0,
    bestRepetitions: 0,
    goalAchievementRate: 0,
    totalRepetitions: 0,
    totalTimeSpent: 0,
    averageTimePerSession: 0,
    longestSession: 0,
    completionSinceCreation: 0,
  });

  // Initialize habits and calculate overall stats
  useEffect(() => {
    if (habits.length > 0) {
      const stats = calculateOverallStats(habits);
      setOverallStats(stats);
      
      if (!selectedHabit) {
        setSelectedHabit(habits[0]);
      } else {
        // If the selected habit still exists, refresh its data
        const existingHabit = habits.find(h => h.id === selectedHabit.id);
        if (existingHabit) {
          // Just keep the existing selected habit
        } else {
          setSelectedHabit(habits[0]);
        }
      }
    }
  }, [habits]);

  // Update charts and stats when selected habit changes
  useEffect(() => {
    if (selectedHabit) {
      const chartData = generateChartData(selectedHabit);
      setLineChartData(chartData);
      
      const stats = calculateHabitStats(selectedHabit);
      setHabitStats(stats);
      
      // Set progress data for the progress chart - always use completionSinceCreation
      // Ensure value is properly formatted for the ProgressChart component
      const progressValue = stats.completionSinceCreation / 100;
      
      setProgressData({
        labels: ["Completion"], // ProgressChart requires labels even when hideLegend is true
        data: [Math.min(1, Math.max(0, progressValue))]
      });
    }
  }, [selectedHabit]);

  // Handle the selected habit change
  const handleSelectHabit = (habit: Habit) => {
    setSelectedHabit(habit);
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (habits.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
            Add habits to see your statistics
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Overall Stats Section */}
        <OverallStats stats={overallStats} />
        
        {/* Habit Performance Section */}
        <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Habit Performance</Text>
          
          {/* Habit Selector */}
          <HabitSelector 
            habits={habits}
            selectedHabit={selectedHabit}
            onSelectHabit={handleSelectHabit}
          />
          
          {/* Habit Detail View with charts and stats */}
          {selectedHabit && (
            <HabitDetailView 
              habit={selectedHabit}
              lineChartData={lineChartData}
              progressData={progressData}
              habitStats={habitStats}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyText: {
    fontSize: 16,
  },
  section: {
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
});