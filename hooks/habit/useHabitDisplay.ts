import { useCallback } from "react";
import { formatTime } from "@/utils/date";

import { Habit } from "@/types/habit";

type HabitDisplayProps = {
  habit: Habit | undefined;
  isCompleted: boolean;
  completionValue: number;
  completionGoal: number;
  elapsedTime: number;
};

export function useHabitDisplay({
  habit,
  isCompleted,
  completionValue,
  completionGoal,
  elapsedTime,
}: HabitDisplayProps) {
  // Format the time for display
  const getDisplayTime = useCallback(() => {
    const combinedTime = completionValue + elapsedTime;
    return formatTime(combinedTime);
  }, [elapsedTime, completionValue]);

  // Generate subtitle text based on habit type
  const getSubtitleText = useCallback(() => {
    if (!habit) return "";

    switch (habit.completion.type) {
      case "simple":
        return isCompleted ? "Completed" : "";
      case "repetitions":
        return `${completionValue} / ${completionGoal}`;
      case "timed":
        return `${getDisplayTime()} / ${formatTime(completionGoal)}`;
      default:
        return "";
    }
  }, [habit, isCompleted, completionValue, completionGoal, getDisplayTime]);

  return { getSubtitleText };
}
