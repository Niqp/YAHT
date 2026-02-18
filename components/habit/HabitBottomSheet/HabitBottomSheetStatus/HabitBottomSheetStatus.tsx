import { useTheme } from "@/hooks/useTheme";
import { useStats } from "@/hooks/useStats";
import type { Habit } from "@/types/habit";
import { Text, View } from "react-native";
import { useEffect } from "react";
import styles from "./HabitBottomSheetStatus.styles";

interface HabitBottomSheetStatusProps {
  habit: Habit;
  isCompleted: boolean;
  selectedDate: string;
}

const HabitBottomSheetStatus = ({ habit, isCompleted, selectedDate }: HabitBottomSheetStatusProps) => {
  const { colors } = useTheme();
  const { habitStats, handleSelectHabit } = useStats();

  useEffect(() => {
    if (habit) {
      handleSelectHabit(habit);
    }
  }, [habit, handleSelectHabit]);

  if (!habit) return null;

  const { totalCompletions, completionRate, currentStreak } = habitStats;

  return (
    <View style={[styles.statusSection, { backgroundColor: colors.input }]}>
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>{totalCompletions}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Completed</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>{completionRate}%</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completion Rate</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>{currentStreak}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Current Streak</Text>
        </View>
      </View>
    </View>
  );
};

export default HabitBottomSheetStatus;
