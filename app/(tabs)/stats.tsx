import React from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import HabitDetailView from "../../components/stats/HabitDetailView";
import HabitSelector from "../../components/stats/HabitSelector";
import OverallStats from "../../components/stats/OverallStats";
import { useStats } from "../../hooks/useStats";
import { useTheme } from "../../hooks/useTheme";

export default function StatsScreen() {
  const { colors } = useTheme();
  const {
    habits,
    habitArray,
    isHydrated,
    selectedHabit,
    overallStats,
    lineChartData,
    progressData,
    habitStats,
    handleSelectHabit,
  } = useStats();

  if (!isHydrated) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (habitArray.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>Add habits to see your statistics</Text>
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
          <HabitSelector habits={habitArray} selectedHabit={selectedHabit} onSelectHabit={handleSelectHabit} />

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
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
});
