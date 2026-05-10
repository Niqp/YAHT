import type { Habit } from "@/types/habit";
import { getCurrentDateStamp, isHabitDueOnDate, isPrimaryDueDate } from "@/utils/date";

export type HabitPresentationStatus = "normal" | "scheduled" | "missed";

export const getHabitPresentationStatus = (
  habit: Habit,
  selectedDate: string,
  today: string = getCurrentDateStamp()
): HabitPresentationStatus => {
  if (selectedDate > today) {
    return "scheduled";
  }

  if (habit.completionHistory?.[selectedDate]?.isCompleted) {
    return "normal";
  }

  if (isHabitDueOnDate(habit, selectedDate) && !isPrimaryDueDate(habit, selectedDate)) {
    return "missed";
  }

  return "normal";
};
