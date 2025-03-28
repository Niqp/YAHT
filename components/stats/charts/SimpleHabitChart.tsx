import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { CheckSquare } from 'lucide-react-native';
import { useTheme } from '../../../hooks/useTheme';

interface SimpleHabitChartProps {
  labels: string[];
  data: number[];
}

const SimpleHabitChart: React.FC<SimpleHabitChartProps> = ({ labels, data }) => {
  const { colors } = useTheme();
  const screenWidth = Dimensions.get('window').width;

  return (
    <View style={styles.activityMapSection}>
      <Text style={[styles.chartTitle, { color: colors.textSecondary }]}>
        Weekly Completion
      </Text>
      <View style={styles.simpleHabitChartContainer}>
        {labels.map((day, index) => {
          const isCompleted = data[index] > 0;
          return (
            <View key={index} style={styles.dayColumn}>
              <Text style={[styles.dayName, {color: colors.textSecondary}]}>
                {day}
              </Text>
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
  );
};

const screenWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  activityMapSection: {
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  chartTitle: {
    fontSize: 14,
    marginBottom: 10,
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
});

export default SimpleHabitChart;