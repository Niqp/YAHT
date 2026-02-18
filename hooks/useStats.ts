import { useCallback, useMemo, useState } from "react";
import { useHabitStore } from "../store/habitStore";
import type { Habit, HabitStats } from "../types/habit";
import { calculateHabitStats, calculateOverallStats, generateChartData } from "../utils/statsUtils";

const EMPTY_OVERALL_STATS = {
  totalHabits: 0,
  completedToday: 0,
  completionRate: 0,
  currentStreak: 0,
  bestStreak: 0,
};

const EMPTY_LINE_CHART_DATA = {
  labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }],
};

const EMPTY_HABIT_STATS: HabitStats = {
  completionRate: 0,
  currentStreak: 0,
  bestStreak: 0,
  totalCompletions: 0,
  lastCompletionDate: "",
  averageRepetitions: 0,
  bestRepetitions: 0,
  goalAchievementRate: 0,
  totalRepetitions: 0,
  totalTimeSpent: 0,
  averageTimePerSession: 0,
  longestSession: 0,
  completionSinceCreation: 0,
};

const EMPTY_PROGRESS_DATA = {
  data: [0],
};

export function useStats() {
  const habits = useHabitStore((state) => state.habits) || {};
  const isHydrated = useHabitStore((state) => state._hasHydrated);

  const habitArray = useMemo(() => Object.values(habits), [habits]);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);

  const selectedHabit = useMemo(() => {
    if (habitArray.length === 0) {
      return null;
    }

    if (selectedHabitId && habits[selectedHabitId]) {
      return habits[selectedHabitId];
    }

    return habitArray[0] ?? null;
  }, [habitArray, habits, selectedHabitId]);

  const overallStats = useMemo(() => {
    if (habitArray.length === 0) {
      return EMPTY_OVERALL_STATS;
    }

    return calculateOverallStats(habits);
  }, [habitArray.length, habits]);

  const lineChartData = useMemo(() => {
    if (!selectedHabit) {
      return EMPTY_LINE_CHART_DATA;
    }

    return generateChartData(selectedHabit);
  }, [selectedHabit]);

  const habitStats = useMemo(() => {
    if (!selectedHabit) {
      return EMPTY_HABIT_STATS;
    }

    return calculateHabitStats(selectedHabit);
  }, [selectedHabit]);

  const progressData = useMemo(() => {
    if (!selectedHabit) {
      return EMPTY_PROGRESS_DATA;
    }

    const progressValue = habitStats.completionSinceCreation / 100;
    return {
      data: [Math.min(1, Math.max(0, progressValue))],
    };
  }, [habitStats.completionSinceCreation, selectedHabit]);

  const handleSelectHabit = useCallback((habit: Habit) => {
    setSelectedHabitId(habit.id);
  }, []);

  return {
    habits,
    habitArray,
    isHydrated,
    selectedHabit,
    overallStats,
    lineChartData,
    progressData,
    habitStats,
    handleSelectHabit,
  };
}
