import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../hooks/useTheme";

interface OverallStatsProps {
  stats: {
    totalHabits: number;
    completedToday: number;
    completionRate: number;
    currentStreak: number;
    bestStreak: number;
  };
}

const OverallStats: React.FC<OverallStatsProps> = ({ stats }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Overall Stats</Text>
      <View style={styles.statsGrid}>
        <View style={[styles.statItem, { backgroundColor: colors.input }]}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{stats.totalHabits}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Habits</Text>
        </View>
        <View style={[styles.statItem, { backgroundColor: colors.input }]}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{stats.completedToday}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completed Today</Text>
        </View>
        <View style={[styles.statItem, { backgroundColor: colors.input }]}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{stats.completionRate}%</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completion Rate</Text>
        </View>
        <View style={[styles.statItem, { backgroundColor: colors.input }]}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{stats.currentStreak}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Current Streak</Text>
        </View>
        <View style={[styles.statItem, { backgroundColor: colors.input }]}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{stats.bestStreak}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Best Streak</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
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
    fontWeight: "bold",
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statItem: {
    width: "45%",
    borderRadius: 8,
    padding: 16,
    marginBottom: 15,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
  },
});

export default OverallStats;
