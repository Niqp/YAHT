import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { useHabitStore } from '../../store/habitStore';
import { Habit } from '../../types/habit';
import { Dimensions } from 'react-native';
import { formatDate } from '../../utils/date';
import { useTheme } from '../../hooks/useTheme';

const screenWidth = Dimensions.get('window').width;

export default function StatsScreen() {
  const { colors, isDarkMode } = useTheme();
  const { habits, isLoading } = useHabitStore();
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [overallStats, setOverallStats] = useState({
    totalHabits: 0,
    completedToday: 0,
    completionRate: 0,
    currentStreak: 0,
    bestStreak: 0,
  });
  const [chartData, setChartData] = useState({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }],
  });

  // Memoize chart config to avoid recreating on each render
  const chartConfig = useMemo(() => ({
    backgroundColor: colors.cardBackground,
    backgroundGradientFrom: colors.cardBackground,
    backgroundGradientTo: colors.cardBackground,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(${isDarkMode ? '200, 200, 255' : '74, 101, 114'}, ${opacity})`,
    labelColor: (opacity = 1) => colors.text,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: colors.primary,
    },
  }), [colors, isDarkMode]);

  useEffect(() => {
    if (habits.length > 0) {
      calculateOverallStats();
      if (!selectedHabit) {
        setSelectedHabit(habits[0]);
      } else {
        // If the selected habit still exists, refresh its data
        const existingHabit = habits.find(h => h.id === selectedHabit.id);
        if (existingHabit) {
          setSelectedHabit(existingHabit);
        } else {
          setSelectedHabit(habits[0]);
        }
      }
    }
  }, [habits]);

  useEffect(() => {
    if (selectedHabit) {
      generateChartData(selectedHabit);
    }
  }, [selectedHabit]);

  const calculateOverallStats = () => {
    const today = formatDate(new Date());
    
    // Count habits completed today
    const completedToday = habits.filter(habit => 
      habit.completionHistory[today]?.completed
    ).length;
    
    // Calculate completion rate for the last 7 days
    const last7Days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      last7Days.push(formatDate(date));
    }
    
    let totalPossible = 0;
    let totalCompleted = 0;
    
    habits.forEach(habit => {
      last7Days.forEach(date => {
        // Check if this habit should be completed on this date
        if (habit.completionHistory[date] !== undefined) {
          totalPossible++;
          if (habit.completionHistory[date]?.completed) {
            totalCompleted++;
          }
        }
      });
    });
    
    const completionRate = totalPossible > 0 
      ? Math.round((totalCompleted / totalPossible) * 100) 
      : 0;
    
    // Calculate current streak (simplified)
    // A more accurate implementation would consider the repetition schedule
    let currentStreak = 0;
    let bestStreak = 0;
    let streakCount = 0;
    
    // Sort dates in descending order (newest first)
    const allDates = Object.keys(habits[0]?.completionHistory || {}).sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );
    
    for (const date of allDates) {
      // Check if any habit was completed on this date
      const anyCompleted = habits.some(habit => 
        habit.completionHistory[date]?.completed
      );
      
      if (anyCompleted) {
        streakCount++;
        if (streakCount > bestStreak) {
          bestStreak = streakCount;
        }
      } else {
        if (streakCount > 0 && currentStreak === 0) {
          currentStreak = streakCount;
        }
        streakCount = 0;
      }
    }
    
    // If we never broke the streak, set current streak
    if (currentStreak === 0 && streakCount > 0) {
      currentStreak = streakCount;
    }
    
    setOverallStats({
      totalHabits: habits.length,
      completedToday,
      completionRate,
      currentStreak,
      bestStreak,
    });
  };

  const generateChartData = (habit: Habit) => {
    // Generate last 7 days data
    const last7Days = [];
    const last7DaysLabels = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const formattedDate = formatDate(date);
      last7Days.push(formattedDate);
      
      // Create short day names for labels
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      last7DaysLabels.push(dayName);
    }
    
    // Map completion data for the habit
    const completionData = last7Days.map(date => {
      if (habit.completionType === 'simple') {
        return habit.completionHistory[date]?.completed ? 1 : 0;
      } else {
        // For repetitions or timed habits, return the value or 0
        return habit.completionHistory[date]?.value || 0;
      }
    });
    
    setChartData({
      labels: last7DaysLabels,
      datasets: [{ data: completionData }],
    });
  };

  const renderHabitButtons = () => {
    return habits.map(habit => (
      <TouchableOpacity
        key={habit.id}
        style={[
          styles.habitButton,
          { backgroundColor: colors.input },
          selectedHabit?.id === habit.id && { backgroundColor: colors.primary },
        ]}
        onPress={() => setSelectedHabit(habit)}
      >
        <Text style={styles.habitButtonIcon}>{habit.icon}</Text>
        <Text 
          style={[
            styles.habitButtonText,
            { color: colors.textSecondary },
            selectedHabit?.id === habit.id && { color: colors.textInverse },
          ]}
          numberOfLines={1}
        >
          {habit.title}
        </Text>
      </TouchableOpacity>
    ));
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
      <ScrollView>
        <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Overall Stats</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statItem, { backgroundColor: colors.input }]}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{overallStats.totalHabits}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Habits</Text>
            </View>
            <View style={[styles.statItem, { backgroundColor: colors.input }]}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{overallStats.completedToday}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completed Today</Text>
            </View>
            <View style={[styles.statItem, { backgroundColor: colors.input }]}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{overallStats.completionRate}%</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completion Rate</Text>
            </View>
            <View style={[styles.statItem, { backgroundColor: colors.input }]}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{overallStats.currentStreak}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Current Streak</Text>
            </View>
            <View style={[styles.statItem, { backgroundColor: colors.input }]}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{overallStats.bestStreak}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Best Streak</Text>
            </View>
          </View>
        </View>
        
        <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Habit Performance</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.habitButtonsContainer}
          >
            {renderHabitButtons()}
          </ScrollView>
          
          {selectedHabit && (
            <View style={styles.chartContainer}>
              <Text style={[styles.habitTitle, { color: colors.text }]}>
                {selectedHabit.icon} {selectedHabit.title}
              </Text>
              <Text style={[styles.chartTitle, { color: colors.textSecondary }]}>Last 7 Days Activity</Text>
              
              {selectedHabit.completionType === 'simple' ? (
                <BarChart
                  data={chartData}
                  width={screenWidth - 40}
                  height={220}
                  chartConfig={chartConfig}
                  style={styles.chart}
                  showValuesOnTopOfBars
                />
              ) : (
                <LineChart
                  data={chartData}
                  width={screenWidth - 40}
                  height={220}
                  chartConfig={chartConfig}
                  style={styles.chart}
                  bezier
                />
              )}
              
              <View style={styles.habitStatsContainer}>
                <View style={[styles.habitStat, { backgroundColor: colors.input }]}>
                  <Text style={[styles.habitStatValue, { color: colors.primary }]}>
                    {Object.values(selectedHabit.completionHistory).filter(h => h.completed).length}
                  </Text>
                  <Text style={[styles.habitStatLabel, { color: colors.textSecondary }]}>Total Completions</Text>
                </View>
                
                <View style={[styles.habitStat, { backgroundColor: colors.input }]}>
                  <Text style={[styles.habitStatValue, { color: colors.primary }]}>
                    {calculateConsistency(selectedHabit)}%
                  </Text>
                  <Text style={[styles.habitStatLabel, { color: colors.textSecondary }]}>Consistency</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// Helper function to calculate consistency percentage for a habit
const calculateConsistency = (habit: Habit): number => {
  const completionHistory = habit.completionHistory;
  const completionDates = Object.keys(completionHistory).filter(
    date => completionHistory[date].completed
  );
  
  // Simple consistency measure: completions / days since creation
  const creationDate = new Date(habit.createdAt);
  const today = new Date();
  const daysSinceCreation = Math.max(
    1,
    Math.ceil((today.getTime() - creationDate.getTime()) / (1000 * 60 * 60 * 24))
  );
  
  return Math.round((completionDates.length / daysSinceCreation) * 100);
};

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
    margin: 16,
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '45%',
    borderRadius: 8,
    padding: 16,
    marginBottom: 15,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
  },
  habitButtonsContainer: {
    paddingVertical: 10,
  },
  habitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 10,
  },
  habitButtonIcon: {
    fontSize: 16,
    marginRight: 5,
  },
  habitButtonText: {
    fontSize: 14,
    maxWidth: 100,
  },
  chartContainer: {
    marginTop: 20,
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  chartTitle: {
    fontSize: 14,
    marginBottom: 15,
  },
  chart: {
    borderRadius: 16,
    marginVertical: 10,
  },
  habitStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  habitStat: {
    width: '48%',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  habitStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  habitStatLabel: {
    fontSize: 14,
  },
});