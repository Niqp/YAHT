import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useTheme } from '../../../hooks/useTheme';

interface PerformanceLineChartProps {
  lineChartData: {
    labels: string[];
    datasets: { data: number[] }[];
  };
}

const PerformanceLineChart: React.FC<PerformanceLineChartProps> = ({ lineChartData }) => {
  const { colors, isDarkMode } = useTheme();
  const screenWidth = Dimensions.get('window').width;

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

  return (
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
  );
};

const styles = StyleSheet.create({
  chartSection: {
    marginBottom: 24,
  },
  chartTitle: {
    fontSize: 14,
    marginBottom: 10,
  },
  chart: {
    marginTop: 10,
    borderRadius: 12,
  },
});

export default PerformanceLineChart;