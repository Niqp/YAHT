import React, { useState, useEffect } from 'react';
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

const screenWidth = Dimensions.get('window').width;

export default function StatsScreen() {
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
          selectedHabit?.id === habit.id && styles.selectedHabitButton,
        ]}
        onPress={() => setSelectedHabit(habit)}
      >
        <Text style={styles.habitButtonIcon}>{habit.icon}</Text>
        <Text 
          style={[
            styles.habitButtonText,
            selectedHabit?.id === habit.id && styles.selectedHabitButtonText,
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A6572" />
      </View>
    );
  }

  if (habits.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Add habits to see your statistics
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overall Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{overallStats.totalHabits}</Text>
              <Text style={styles.statLabel}>Total Habits</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{overallStats.completedToday}</Text>
              <Text style={styles.statLabel}>Completed Today</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{overallStats.completionRate}%</Text>
              <Text style={styles.statLabel}>Completion Rate</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{overallStats.currentStreak}</Text>
              <Text style={styles.statLabel}>Current Streak</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{overallStats.bestStreak}</Text>
              <Text style={styles.statLabel}>Best Streak</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Habit Performance</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.habitButtonsContainer}
          >
            {renderHabitButtons()}
          </ScrollView>
          
          {selectedHabit && (
            <View style={styles.chartContainer}>
              <Text style={styles.habitTitle}>
                {selectedHabit.icon} {selectedHabit.title}
              </Text>
              <Text style={styles.chartTitle}>Last 7 Days Activity</Text>
              
              {selectedHabit.completionType === 'simple' ? (
                <BarChart
                  data={chartData}
                  width={screenWidth - 40}
                  height={220}
                  chartConfig={{
                    backgroundColor: '#FFFFFF',
                    backgroundGradientFrom: '#FFFFFF',
                    backgroundGradientTo: '#FFFFFF',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(74, 101, 114, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(74, 101, 114, ${opacity})`,
                    style: {
                      borderRadius: 16,
                    },
                  }}
                  style={styles.chart}
                  showValuesOnTopOfBars
                />
              ) : (
                <LineChart
                  data={chartData}
                  width={screenWidth - 40}
                  height={220}
                  chartConfig={{
                    backgroundColor: '#FFFFFF',
                    backgroundGradientFrom: '#FFFFFF',
                    backgroundGradientTo: '#FFFFFF',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(74, 101, 114, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(74, 101, 114, ${opacity})`,
                    style: {
                      borderRadius: 16,
                    },
                    propsForDots: {
                      r: '6',
                      strokeWidth: '2',
                      stroke: '#4A6572',
                    },
                  }}
                  style={styles.chart}
                  bezier
                />
              )}
              
              <View style={styles.habitStatsContainer}>
                {/* Calculate habit-specific stats here */}
                <View style={styles.habitStat}>
                  <Text style={styles.habitStatValue}>
                    {Object.values(selectedHabit.completionHistory).filter(h => h.completed).length}
                  </Text>
                  <Text style={styles.habitStatLabel}>Total Completions</Text>
                </View>
                
                <View style={styles.habitStat}>
                  <Text style={styles.habitStatValue}>
                    {calculateConsistency(selectedHabit)}%
                  </Text>
                  <Text style={styles.habitStatLabel}>Consistency</Text>
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
    backgroundColor: '#F8F9FA',
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
    color: '#9E9E9E',
  },
  section: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
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
    color: '#212121',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '45%',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 15,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A6572',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#757575',
  },
  habitButtonsContainer: {
    paddingVertical: 10,
  },
  habitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 10,
  },
  selectedHabitButton: {
    backgroundColor: '#4A6572',
  },
  habitButtonIcon: {
    fontSize: 16,
    marginRight: 5,
  },
  habitButtonText: {
    fontSize: 14,
    color: '#757575',
    maxWidth: 100,
  },
  selectedHabitButtonText: {
    color: '#FFFFFF',
  },
  chartContainer: {
    marginTop: 20,
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 10,
  },
  chartTitle: {
    fontSize: 14,
    color: '#757575',
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
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  habitStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A6572',
    marginBottom: 5,
  },
  habitStatLabel: {
    fontSize: 14,
    color: '#757575',
  },
});