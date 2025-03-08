import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LineChart, BarChart, ProgressChart, ContributionGraph } from 'react-native-chart-kit';
import { useHabitStore } from '../../store/habitStore';
import { Habit } from '../../types/habit';
import { formatDate, formatTime } from '../../utils/date';
import { useTheme } from '../../hooks/useTheme';
import { Clock, RotateCcw, CheckSquare, TrendingUp, Award, Calendar, ChevronDown } from 'lucide-react-native';

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
  
  // Habit-specific stats
  const [habitStats, setHabitStats] = useState({
    // Simple habits
    completionRate: 0,
    currentStreak: 0,
    bestStreak: 0,
    totalCompletions: 0,
    lastCompletionDate: '',
    
    // Repetition habits
    averageRepetitions: 0,
    bestRepetitions: 0,
    goalAchievementRate: 0,
    totalRepetitions: 0,
    
    // Timed habits
    totalTimeSpent: 0,
    averageTimePerSession: 0,
    longestSession: 0,
    goalAchievementRate: 0,
  });
  
  // Charts data
  const [lineChartData, setLineChartData] = useState({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }],
  });
  
  const [contributionData, setContributionData] = useState<{date: string, count: number}[]>([]);
  
  const [progressData, setProgressData] = useState({
    data: [0],
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

  // Initialize habits and calculate overall stats
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

  // Update charts and stats when selected habit changes
  useEffect(() => {
    if (selectedHabit) {
      generateChartData(selectedHabit);
      calculateHabitStats(selectedHabit);
    }
  }, [selectedHabit]);

  // Calculate overall stats across all habits
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
    
    // Calculate current streak and best streak
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
  
  // Calculate habit-specific stats based on habit type
  const calculateHabitStats = (habit: Habit) => {
    const completionHistory = habit.completionHistory;
    const completionDates = Object.keys(completionHistory);
    
    if (completionDates.length === 0) {
      // No data yet
      return;
    }
    
    // Sort dates from newest to oldest
    const sortedDates = completionDates.sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );
    
    // Stats for all habit types
    const totalCompletions = completionDates.filter(
      date => completionHistory[date].completed
    ).length;
    
    const lastCompletionDate = completionDates
      .filter(date => completionHistory[date].completed)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] || '';
      
    // Calculate streaks for this specific habit
    let currentStreak = 0;
    let bestStreak = 0;
    let streakCount = 0;
    
    for (const date of sortedDates) {
      if (completionHistory[date]?.completed) {
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
    
    // If streak is ongoing, set current streak
    if (currentStreak === 0 && streakCount > 0) {
      currentStreak = streakCount;
    }
    
    // Completion rate for all dates with history
    const completionRate = Math.round(
      (totalCompletions / completionDates.length) * 100
    );
    
    const newStats = {
      // Simple habit stats (defaults)
      completionRate,
      currentStreak,
      bestStreak,
      totalCompletions,
      lastCompletionDate,
      
      // Repetition habit stats (defaults)
      averageRepetitions: 0,
      bestRepetitions: 0,
      goalAchievementRate: 0,
      totalRepetitions: 0,
      
      // Timed habit stats (defaults)
      totalTimeSpent: 0,
      averageTimePerSession: 0,
      longestSession: 0,
      goalAchievementRate: 0,
    };
    
    // Additional stats for repetition habits
    if (habit.completionType === 'repetitions') {
      const values = completionDates
        .filter(date => completionHistory[date].value !== undefined)
        .map(date => completionHistory[date].value as number);
      
      if (values.length > 0) {
        const totalRepetitions = values.reduce((sum, val) => sum + val, 0);
        const averageRepetitions = Math.round((totalRepetitions / values.length) * 10) / 10;
        const bestRepetitions = Math.max(...values);
        
        // Calculate how often the goal was reached
        const goalReachedCount = completionDates.filter(
          date => (completionHistory[date].value as number) >= (habit.completionGoal || 0)
        ).length;
        
        const goalAchievementRate = Math.round(
          (goalReachedCount / completionDates.length) * 100
        );
        
        Object.assign(newStats, {
          averageRepetitions,
          bestRepetitions,
          goalAchievementRate,
          totalRepetitions,
        });
      }
    }
    
    // Additional stats for timed habits
    if (habit.completionType === 'timed') {
      const values = completionDates
        .filter(date => completionHistory[date].value !== undefined)
        .map(date => completionHistory[date].value as number);
      
      if (values.length > 0) {
        const totalTimeSpent = values.reduce((sum, val) => sum + val, 0);
        const averageTimePerSession = Math.round(totalTimeSpent / values.length);
        const longestSession = Math.max(...values);
        
        // Calculate how often the goal was reached
        const goalReachedCount = completionDates.filter(
          date => (completionHistory[date].value as number) >= (habit.completionGoal || 0)
        ).length;
        
        const goalAchievementRate = Math.round(
          (goalReachedCount / completionDates.length) * 100
        );
        
        Object.assign(newStats, {
          totalTimeSpent,
          averageTimePerSession,
          longestSession,
          goalAchievementRate,
        });
      }
    }
    
    setHabitStats(newStats);
    
    // Set progress data for the progress chart - for all habit types
    const progressValue = 
      habit.completionType === 'simple' 
        ? newStats.completionRate / 100
        : newStats.goalAchievementRate / 100;
    
    setProgressData({
      data: [Math.min(1, Math.max(0, progressValue))]
    });
  };

  // Generate chart data based on habit type
  const generateChartData = (habit: Habit) => {
    // Get the last 7 days for all habit types
    const last7Days = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      last7Days.push(formatDate(date));
    }
    
    const last7DaysLabels = last7Days.map(date => {
      const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
      return dayName;
    });
    
    if (habit.completionType === 'simple') {
      // For simple habits, we'll create a binary completion data
      // This will be used in our custom simple chart display
      const completionData = last7Days.map(date => {
        const historyEntry = habit.completionHistory[date];
        return historyEntry?.completed ? 1 : 0;
      });
      
      setLineChartData({
        labels: last7DaysLabels,
        datasets: [{ data: completionData }],
      });
    } else {
      // For repetition and timed habits, prepare data for the line chart
      const values = last7Days.map(date => {
        const historyEntry = habit.completionHistory[date];
        return historyEntry ? (historyEntry.value || 0) : 0;
      });
      
      setLineChartData({
        labels: last7DaysLabels,
        datasets: [{ data: values }],
      });
    }
  };

  // Render habit selection dropdown
  const renderHabitDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    
    if (!selectedHabit) return null;
    
    return (
      <View style={styles.dropdownContainer}>
        <TouchableOpacity 
          style={[styles.dropdownButton, { backgroundColor: colors.input }]}
          onPress={() => setIsOpen(!isOpen)}
        >
          <View style={styles.selectedHabitContainer}>
            <Text style={styles.selectedHabitIcon}>{selectedHabit.icon}</Text>
            <Text style={[styles.selectedHabitText, { color: colors.text }]}>
              {selectedHabit.title}
            </Text>
          </View>
          <ChevronDown size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        
        {isOpen && (
          <View style={[styles.dropdownMenu, { backgroundColor: colors.cardBackground }]}>
            <ScrollView 
              style={styles.dropdownScroll}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.dropdownScrollContent}
            >
              {habits.map(habit => (
                <TouchableOpacity
                  key={habit.id}
                  style={[
                    styles.dropdownItem,
                    selectedHabit?.id === habit.id && { backgroundColor: colors.input },
                  ]}
                  onPress={() => {
                    setSelectedHabit(habit);
                    setIsOpen(false);
                  }}
                >
                  <Text style={styles.dropdownItemIcon}>{habit.icon}</Text>
                  <Text 
                    style={[styles.dropdownItemText, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {habit.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    );
  };
  
  // Render the appropriate chart based on habit type
  const renderHabitChart = () => {
    if (!selectedHabit) return null;
    
    return (
      <View style={styles.chartContainer}>
        <View style={styles.habitHeaderContainer}>
          <Text style={[styles.habitTitle, { color: colors.text }]}>
            {selectedHabit.icon} {selectedHabit.title}
          </Text>
          {renderHabitTypeIndicator()}
        </View>
        
        {/* First visualization - specific to habit type */}
        {selectedHabit.completionType === 'simple' ? (
          <View style={styles.activityMapSection}>
            <Text style={[styles.chartTitle, { color: colors.textSecondary }]}>
              Weekly Completion
            </Text>
            <View style={styles.simpleHabitChartContainer}>
              {lineChartData.labels.map((day, index) => {
                const isCompleted = lineChartData.datasets[0].data[index] > 0;
                return (
                  <View key={index} style={styles.dayColumn}>
                    <Text style={[styles.dayName, {color: colors.textSecondary}]}>{day}</Text>
                    <View 
                      style={[
                        styles.completionIndicator, 
                        { 
                          backgroundColor: isCompleted ? colors.primary : colors.input,
                          borderColor: isCompleted ? colors.primary : colors.border 
                        }
                      ]}
                    >
                      {isCompleted && <CheckSquare size={16} color="#fff" />}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ) : (
          <View style={styles.chartSection}>
            <Text style={[styles.chartTitle, { color: colors.textSecondary }]}>
              Last 7 Days Performance
            </Text>
            <LineChart
              data={lineChartData}
              width={screenWidth - 64}
              height={180}
              chartConfig={chartConfig}
              style={styles.chart}
              bezier
              fromZero
            />
          </View>
        )}
        
        {/* Second visualization - progress circle for all types */}
        <View style={styles.progressSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {selectedHabit.completionType === 'simple' 
              ? 'Completion Rate' 
              : 'Goal Achievement'}
          </Text>
          
          <View style={styles.progressRow}>
            <View style={styles.progressChartContainer}>
              <ProgressChart
                data={progressData}
                width={screenWidth * 0.32}
                height={100}
                strokeWidth={8}
                radius={30}
                chartConfig={{
                  ...chartConfig,
                  color: (opacity = 1) => colors.primary,
                  backgroundGradientFromOpacity: 0,
                  backgroundGradientToOpacity: 0,
                }}
                hideLegend
                style={styles.progressChart}
              />
              <Text style={[styles.progressText, { color: colors.primary }]}>
                {selectedHabit.completionType === 'simple' 
                  ? `${habitStats.completionRate}%` 
                  : `${habitStats.goalAchievementRate}%`}
              </Text>
            </View>
            
            <View style={styles.progressStatsContainer}>
              <View style={[styles.progressStat, { backgroundColor: colors.input }]}>
                <Text style={[styles.progressStatValue, { color: colors.text }]}>
                  {habitStats.totalCompletions}
                </Text>
                <Text style={[styles.progressStatLabel, { color: colors.textSecondary }]}>
                  Completions
                </Text>
              </View>
              
              <View style={[styles.progressStat, { backgroundColor: colors.input }]}>
                <Text style={[styles.progressStatValue, { color: colors.text }]}>
                  {habitStats.currentStreak}
                </Text>
                <Text style={[styles.progressStatLabel, { color: colors.textSecondary }]}>
                  Current Streak
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Type-specific stats section */}
        {renderHabitTypeStats()}
      </View>
    );
  };
  
  // Render stats specific to the habit type
  const renderHabitTypeStats = () => {
    if (!selectedHabit) return null;
    
    let stats = [];
    
    switch (selectedHabit.completionType) {
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
    // For simple habits with 2 stats, use 47% width to fill the row
    const statWidth = selectedHabit.completionType === 'simple' ? '47%' : '30%';
    
    return (
      <View style={styles.typeStatsSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {selectedHabit.completionType === 'simple' 
            ? 'Simple Habit Stats' 
            : selectedHabit.completionType === 'repetitions'
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
  
  // Render an indicator of the habit type (simple, repetitions, timed)
  const renderHabitTypeIndicator = () => {
    if (!selectedHabit) return null;
    
    let icon;
    let label;
    
    switch (selectedHabit.completionType) {
      case 'simple':
        icon = <CheckSquare size={16} color={colors.textSecondary} />;
        label = 'Simple';
        break;
      case 'repetitions':
        icon = <RotateCcw size={16} color={colors.textSecondary} />;
        label = 'Repetitions';
        break;
      case 'timed':
        icon = <Clock size={16} color={colors.textSecondary} />;
        label = 'Timed';
        break;
    }
    
    return (
      <View style={[styles.habitTypeTag, { backgroundColor: colors.input }]}>
        {icon}
        <Text style={[styles.habitTypeTagText, { color: colors.textSecondary }]}>
          {label}
        </Text>
      </View>
    );
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
          {renderHabitDropdown()}
          
          {renderHabitChart()}
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
  // Dropdown styles
  dropdownContainer: {
    marginBottom: 16,
    zIndex: 1000,
    position: 'relative',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    padding: 12,
  },
  selectedHabitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedHabitIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  selectedHabitText: {
    fontSize: 16,
    fontWeight: '500',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
    maxHeight: 250,
  },
  dropdownScroll: {
    maxHeight: 250,
  },
  dropdownScrollContent: {
    padding: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginVertical: 2,
  },
  dropdownItemIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  dropdownItemText: {
    fontSize: 16,
  },
  habitHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  habitTypeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  habitTypeTagText: {
    fontSize: 12,
    marginLeft: 4,
  },
  chartContainer: {
    marginTop: 10,
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  chartTitle: {
    fontSize: 14,
    marginBottom: 10,
  },
  // Custom simple habit chart
  activityMapSection: {
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  simpleHabitChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
    paddingHorizontal: 8,
  },
  dayColumn: {
    alignItems: 'center',
    width: (screenWidth - 100) / 7,
  },
  dayName: {
    fontSize: 12,
    marginBottom: 8,
    fontWeight: '500',
  },
  completionIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  // Line chart (for repetition/timed habits)
  chartSection: {
    marginBottom: 24,
  },
  chart: {
    marginTop: 10,
    borderRadius: 12,
  },
  // Progress section
  progressSection: {
    marginBottom: 24,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 10,
    paddingHorizontal: 8,
  },
  progressChartContainer: {
    width: screenWidth * 0.35,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  progressChart: {
    borderRadius: 12,
  },
  progressText: {
    fontSize: 16,
    fontWeight: 'bold',
    position: 'absolute',
  },
  progressStatsContainer: {
    width: screenWidth * 0.45,
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  progressStat: {
    width: '100%',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  progressStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  progressStatLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  // Type-specific stats section
  typeStatsSection: {
    marginBottom: 24,
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