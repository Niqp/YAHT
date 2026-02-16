import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { ProgressChart } from 'react-native-chart-kit';
import { useTheme } from '../../../hooks/useTheme';
import { CompletionType } from '../../../types/habit';

interface ProgressCircleProps {
  progressData: {
    labels?: string[];
    data: number[];
  };
  completionType: CompletionType;
  stats: {
    completionRate: number;
    goalAchievementRate: number;
    totalCompletions: number;
    currentStreak: number;
    completionSinceCreation: number;
  };
}

const ProgressCircle: React.FC<ProgressCircleProps> = ({ 
  progressData, 
  completionType,
  stats
}) => {
  const { colors, isDarkMode } = useTheme();
  const screenWidth = Dimensions.get('window').width;

  // Memoize chart config
  const chartConfig = useMemo(() => ({
    backgroundColor: colors.cardBackground,
    backgroundGradientFrom: colors.cardBackground,
    backgroundGradientTo: colors.cardBackground,
    color: (opacity = 1) => `rgba(${isDarkMode ? '106, 142, 174' : '74, 101, 114'}, ${opacity})`,
    backgroundGradientFromOpacity: 0,
    backgroundGradientToOpacity: 0,
    labelColor: (opacity = 1) => colors.text,
    strokeWidth: 2, // Ensure stroke width is set correctly
  }), [colors, isDarkMode]);

  // Always use completionSinceCreation regardless of habit type
  const progressValue = stats.completionSinceCreation;

  return (
    <View style={styles.progressSection}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Completion Since Creation
      </Text>
      
      <View style={styles.progressRow}>
        <View style={styles.progressChartContainer}>
          <ProgressChart
            data={progressData}
            width={screenWidth * 0.32}
            height={100}
            strokeWidth={10}
            radius={32}
            chartConfig={chartConfig}
            hideLegend={true}
            style={styles.progressChart}
          />
          <Text style={[styles.progressText, { color: colors.primary }]}>
            {`${progressValue}%`}
          </Text>
        </View>
        
        <View style={styles.progressStatsContainer}>
          <View style={[styles.progressStat, { backgroundColor: colors.input }]}>
            <Text style={[styles.progressStatValue, { color: colors.text }]}>
              {stats.totalCompletions}
            </Text>
            <Text style={[styles.progressStatLabel, { color: colors.textSecondary }]}>
              Completions
            </Text>
          </View>
          
          <View style={[styles.progressStat, { backgroundColor: colors.input }]}>
            <Text style={[styles.progressStatValue, { color: colors.text }]}>
              {stats.currentStreak}
            </Text>
            <Text style={[styles.progressStatLabel, { color: colors.textSecondary }]}>
              Current Streak
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const screenWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  progressSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
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
});

export default ProgressCircle;
