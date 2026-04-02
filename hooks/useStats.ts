import { useCallback, useMemo, useState } from "react";
import { useHabitStore } from "../store/habitStore";
import type { Habit, HabitChartData, HabitStats, OverallStats } from "../types/habit";
import { calculateHabitStats, calculateOverallStats, generateChartData } from "../utils/statsUtils";

const EMPTY_OVERALL_STATS: OverallStats = {
  activeHabits: 0,
  dueToday: 0,
  completedToday: 0,
  todayAdherence: 0,
  dueLast7Days: 0,
  completedLast7Days: 0,
  last7DayAdherence: 0,
};

const EMPTY_CHART_DATA: HabitChartData = { days: [] };

const EMPTY_HABIT_STATS: HabitStats = {
  dueDaysSinceCreation: 0,
  completedDueDays: 0,
  adherenceSinceCreation: 0,
  currentStreak: 0,
  bestStreak: 0,
  totalCompletions: 0,
  lastCompletedDate: "",
  goalHitRate: 0,
  totalRepetitions: 0,
  totalTimeSpent: 0,
  bestDayValue: 0,
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

  const chartData = useMemo(() => {
    if (!selectedHabit) {
      return EMPTY_CHART_DATA;
    }

    return generateChartData(selectedHabit);
  }, [selectedHabit]);

  const habitStats = useMemo(() => {
    if (!selectedHabit) {
      return EMPTY_HABIT_STATS;
    }

    return calculateHabitStats(selectedHabit);
  }, [selectedHabit]);

  const handleSelectHabit = useCallback((habit: Habit) => {
    setSelectedHabitId(habit.id);
  }, []);

  return {
    habits,
    habitArray,
    isHydrated,
    selectedHabit,
    overallStats,
    chartData,
    habitStats,
    handleSelectHabit,
  };
}
