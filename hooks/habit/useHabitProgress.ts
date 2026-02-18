import { Habit } from "@/types/habit";
import { useMemo } from "react";

type HabitProgressProps = {
  habit: Habit | undefined;
  isCompleted: boolean;
  completionValue: number;
  completionGoal: number;
  isTimerActive: boolean;
  elapsedTime: number;
};

export function useHabitProgress({
  habit,
  isCompleted,
  completionValue,
  completionGoal,
  isTimerActive,
  elapsedTime,
}: HabitProgressProps) {
  // Progress calculation for visual indicator
  const progress = useMemo(() => {
    if (!habit) return 0;

    if (habit.completion.type === "simple") {
      return isCompleted ? 1 : 0;
    }
    if (habit.completion.type === "timed" && isTimerActive) {
      // For active timers, combine stored and real-time elapsed values.
      const currentValue = (completionValue || 0) + (elapsedTime || 0);
      const goal = completionGoal || 1; // Prevent division by zero
      return Math.min(1, currentValue / goal);
    }
    // For paused timers or repetition habits, use the stored value
    const value = completionValue || 0;
    const goal = completionGoal || 1; // Prevent division by zero
    return Math.min(1, value / goal);
  }, [habit, isCompleted, completionValue, completionGoal, isTimerActive, elapsedTime]);

  // Convert decimal progress to percentage (0-100)
  return progress * 100;
}
